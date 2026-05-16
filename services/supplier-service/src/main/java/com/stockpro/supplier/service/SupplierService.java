package com.stockpro.supplier.service;

import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(SupplierRequest request);

    SupplierResponse getById(int supplierId);

    List<SupplierResponse> getAllSuppliers(boolean includeInactive);

    List<SupplierResponse> searchSuppliers(String query);

    SupplierResponse updateSupplier(int supplierId, SupplierRequest request);

    void deactivateSupplier(int supplierId);
    void reactivateSupplier(int supplierId);
    void deleteSupplier(int supplierId);

    List<SupplierResponse> getByCity(String city);

    List<SupplierResponse> getByCountry(String country);

    void updateRating(int supplierId, double newRating);
}
