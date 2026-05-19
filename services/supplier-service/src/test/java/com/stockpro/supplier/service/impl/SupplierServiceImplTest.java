package com.stockpro.supplier.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;
import com.stockpro.supplier.entity.SupplierEntity;
import com.stockpro.supplier.exception.CustomException;
import com.stockpro.supplier.mapper.SupplierMapper;
import com.stockpro.supplier.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupplierServiceImpl")
class SupplierServiceImplTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private SupplierMapper supplierMapper;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    private SupplierEntity supplier;
    private SupplierRequest request;
    private SupplierResponse response;

    @BeforeEach
    void setUp() {
        supplier = SupplierEntity.builder()
                .supplierId(1)
                .name("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("123456789")
                .address("123 Industrial Rd")
                .city("Chicago")
                .country("USA")
                .taxId("TAX-12345")
                .paymentTerms("NET30")
                .leadTimeDays(7)
                .rating(4.5)
                .active(true)
                .build();

        request = SupplierRequest.builder()
                .name("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("123456789")
                .address("123 Industrial Rd")
                .city("Chicago")
                .country("USA")
                .taxId("TAX-12345")
                .paymentTerms("NET30")
                .leadTimeDays(7)
                .build();

        response = new SupplierResponse();
        response.setSupplierId(1);
        response.setName("Acme Corp");
        response.setContactPerson("John Doe");
        response.setEmail("john@acme.com");
        response.setPhone("123456789");
        response.setAddress("123 Industrial Rd");
        response.setCity("Chicago");
        response.setCountry("USA");
        response.setTaxId("TAX-12345");
        response.setPaymentTerms("NET30");
        response.setLeadTimeDays(7);
        response.setRating(4.5);
        response.setActive(true);
    }

    @Nested
    @DisplayName("createSupplier()")
    class CreateSupplier {

        @Test
        @DisplayName("saves and returns supplier when Tax ID is unique")
        void success() {
            when(supplierRepository.findByTaxId("TAX-12345")).thenReturn(Optional.empty());
            when(supplierMapper.toEntity(any(SupplierRequest.class))).thenReturn(supplier);
            when(supplierRepository.save(any(SupplierEntity.class))).thenReturn(supplier);
            when(supplierMapper.toResponse(any(SupplierEntity.class))).thenReturn(response);

            SupplierResponse result = supplierService.createSupplier(request);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Acme Corp");
            verify(supplierRepository).save(any(SupplierEntity.class));
        }

        @Test
        @DisplayName("throws CONFLICT when Tax ID is already in use by another supplier")
        void duplicateTaxId_throwsConflict() {
            when(supplierRepository.findByTaxId("TAX-12345")).thenReturn(Optional.of(supplier));

            CustomException ex = catchThrowableOfType(
                    () -> supplierService.createSupplier(request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(ex.getMessage()).contains("TAX-12345");
            verify(supplierRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getById() & retrievals")
    class Retrievals {

        @Test
        @DisplayName("returns supplier response by id when found")
        void getById_found() {
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            SupplierResponse result = supplierService.getById(1);

            assertThat(result).isNotNull();
            assertThat(result.getSupplierId()).isEqualTo(1);
        }

        @Test
        @DisplayName("throws NOT_FOUND by id when not found")
        void getById_notFound() {
            when(supplierRepository.findBySupplierId(99)).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> supplierService.getById(99), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("getAllSuppliers() & searchSuppliers() & filtering")
    class Lists {

        @Test
        @DisplayName("returns active suppliers only when includeInactive is false")
        void getActiveOnly() {
            when(supplierRepository.findByActive(true)).thenReturn(List.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            List<SupplierResponse> result = supplierService.getAllSuppliers(false);

            assertThat(result).hasSize(1);
            verify(supplierRepository).findByActive(true);
            verify(supplierRepository, never()).findAll();
        }

        @Test
        @DisplayName("returns all suppliers when includeInactive is true")
        void getAllIncludingInactive() {
            when(supplierRepository.findAll()).thenReturn(List.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            List<SupplierResponse> result = supplierService.getAllSuppliers(true);

            assertThat(result).hasSize(1);
            verify(supplierRepository).findAll();
            verify(supplierRepository, never()).findByActive(true);
        }

        @Test
        @DisplayName("returns matching suppliers for search query")
        void searchSuppliers() {
            when(supplierRepository.searchByName("Acme")).thenReturn(List.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            List<SupplierResponse> result = supplierService.searchSuppliers("Acme");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns suppliers by city")
        void getByCity() {
            when(supplierRepository.findByCity("Chicago")).thenReturn(List.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            List<SupplierResponse> result = supplierService.getByCity("Chicago");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns suppliers by country")
        void getByCountry() {
            when(supplierRepository.findByCountry("USA")).thenReturn(List.of(supplier));
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            List<SupplierResponse> result = supplierService.getByCountry("USA");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateSupplier()")
    class UpdateSupplier {

        @Test
        @DisplayName("updates and saves supplier when unique Tax ID and found")
        void success() {
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierRepository.findByTaxId("TAX-12345")).thenReturn(Optional.of(supplier)); // owned by self
            when(supplierRepository.save(supplier)).thenReturn(supplier);
            when(supplierMapper.toResponse(supplier)).thenReturn(response);

            SupplierResponse result = supplierService.updateSupplier(1, request);

            assertThat(result).isNotNull();
            verify(supplierMapper).updateEntityFromRequest(request, supplier);
            verify(supplierRepository).save(supplier);
        }

        @Test
        @DisplayName("throws NOT_FOUND when supplier does not exist")
        void notFound_throwsNotFound() {
            when(supplierRepository.findBySupplierId(99)).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> supplierService.updateSupplier(99, request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            verify(supplierRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws CONFLICT when Tax ID belongs to another supplier")
        void duplicateTaxIdOnUpdate_throwsConflict() {
            SupplierEntity other = SupplierEntity.builder().supplierId(2).taxId("TAX-12345").build();
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierRepository.findByTaxId("TAX-12345")).thenReturn(Optional.of(other));

            CustomException ex = catchThrowableOfType(
                    () -> supplierService.updateSupplier(1, request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            verify(supplierRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deactivate & reactivate & delete")
    class StatusAndLifecycle {

        @Test
        @DisplayName("deactivates supplier successfully")
        void deactivateSuccess() {
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(supplier)).thenReturn(supplier);

            supplierService.deactivateSupplier(1);

            assertThat(supplier.isActive()).isFalse();
            verify(supplierRepository).save(supplier);
        }

        @Test
        @DisplayName("reactivates supplier successfully")
        void reactivateSuccess() {
            supplier.setActive(false);
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(supplier)).thenReturn(supplier);

            supplierService.reactivateSupplier(1);

            assertThat(supplier.isActive()).isTrue();
            verify(supplierRepository).save(supplier);
        }

        @Test
        @DisplayName("deletes supplier successfully when it exists")
        void deleteSuccess() {
            when(supplierRepository.existsById(1)).thenReturn(true);

            supplierService.deleteSupplier(1);

            verify(supplierRepository).deleteById(1);
        }

        @Test
        @DisplayName("delete throws NOT_FOUND when supplier does not exist")
        void deleteNotFound_throwsNotFound() {
            when(supplierRepository.existsById(99)).thenReturn(false);

            CustomException ex = catchThrowableOfType(
                    () -> supplierService.deleteSupplier(99), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            verify(supplierRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("updateRating()")
    class UpdateRating {

        @Test
        @DisplayName("updates supplier rating successfully")
        void ratingSuccess() {
            when(supplierRepository.findBySupplierId(1)).thenReturn(Optional.of(supplier));
            when(supplierRepository.save(supplier)).thenReturn(supplier);

            supplierService.updateRating(1, 4.8);

            assertThat(supplier.getRating()).isEqualTo(4.8);
            verify(supplierRepository).save(supplier);
        }
    }
}
