package com.stockpro.supplier.service.impl;

import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;
import com.stockpro.supplier.entity.SupplierEntity;
import com.stockpro.supplier.exception.CustomException;
import com.stockpro.supplier.mapper.SupplierMapper;
import com.stockpro.supplier.repository.SupplierRepository;
import com.stockpro.supplier.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        log.info("Creating new supplier: {}", request.getName());
        validateUniqueTaxId(request.getTaxId(), null);
        SupplierEntity supplier = supplierMapper.toEntity(request);
        SupplierEntity savedSupplier = supplierRepository.save(supplier);
        return supplierMapper.toResponse(savedSupplier);
    }

    @Override
    public SupplierResponse getById(int supplierId) {
        log.info("Fetching supplier with ID: {}", supplierId);
        return supplierRepository.findBySupplierId(supplierId)
                .map(supplierMapper::toResponse)
            .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId));
    }

    @Override
    public List<SupplierResponse> getAllSuppliers(boolean includeInactive) {
        log.info("Fetching suppliers (includeInactive={})", includeInactive);
        List<SupplierEntity> suppliers = includeInactive ? supplierRepository.findAll() : supplierRepository.findByActive(true);
        return suppliers.stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SupplierResponse> searchSuppliers(String query) {
        log.info("Searching suppliers with query: {}", query);
        return supplierRepository.searchByName(query).stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(int supplierId, SupplierRequest request) {
        log.info("Updating supplier with ID: {}", supplierId);
        SupplierEntity supplier = supplierRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId));

        validateUniqueTaxId(request.getTaxId(), supplierId);
        supplierMapper.updateEntityFromRequest(request, supplier);
        SupplierEntity updatedSupplier = supplierRepository.save(supplier);
        return supplierMapper.toResponse(updatedSupplier);
    }

    @Override
    @Transactional
    public void deactivateSupplier(int supplierId) {
        log.info("Deactivating supplier with ID: {}", supplierId);
        SupplierEntity supplier = supplierRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId));

        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public void reactivateSupplier(int supplierId) {
        log.info("Reactivating supplier with ID: {}", supplierId);
        SupplierEntity supplier = supplierRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId));

        supplier.setActive(true);
        supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public void deleteSupplier(int supplierId) {
        log.info("Deleting supplier with ID: {}", supplierId);
        if (!supplierRepository.existsById(supplierId)) {
            throw new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId);
        }
        supplierRepository.deleteById(supplierId);
    }

    @Override
    public List<SupplierResponse> getByCity(String city) {
        log.info("Fetching suppliers in city: {}", city);
        return supplierRepository.findByCity(city).stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SupplierResponse> getByCountry(String country) {
        log.info("Fetching suppliers in country: {}", country);
        return supplierRepository.findByCountry(country).stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateRating(int supplierId, double newRating) {
        log.info("Updating rating for supplier ID: {} to {}", supplierId, newRating);
        SupplierEntity supplier = supplierRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Supplier not found with ID: " + supplierId));

        // Rating logic: recalculate rolling average (simplified here as overwrite or
        // custom logic)
        // In a real scenario, this might be (currentRating + newRating) / 2 or weighted
        supplier.setRating(newRating);
        supplierRepository.save(supplier);
    }

    private void validateUniqueTaxId(String taxId, Integer currentSupplierId) {
        if (!StringUtils.hasText(taxId)) {
            return;
        }

        String normalizedTaxId = taxId.trim();
        supplierRepository.findByTaxId(normalizedTaxId)
                .filter(existing -> currentSupplierId == null || existing.getSupplierId() != currentSupplierId)
                .ifPresent(existing -> {
                    throw new CustomException(HttpStatus.CONFLICT,
                            "Tax ID '" + normalizedTaxId + "' is already used by supplier ID: "
                                    + existing.getSupplierId());
                });
    }
}
