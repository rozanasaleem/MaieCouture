package com.maiecouture.store.customrequest;

import com.maiecouture.store.common.ResourceNotFoundException;
import com.maiecouture.store.product.Product;
import com.maiecouture.store.product.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CustomRequestService {

    private final CustomRequestRepository customRequestRepository;
    private final ProductRepository productRepository;

    public CustomRequestService(CustomRequestRepository customRequestRepository, ProductRepository productRepository) {
        this.customRequestRepository = customRequestRepository;
        this.productRepository = productRepository;
    }

    public List<CustomRequestResponse> getRequests() {
        return customRequestRepository.findAll().stream()
                .map(CustomRequestResponse::from)
                .toList();
    }

    @Transactional
    public CustomRequestResponse createRequest(CustomRequestRequest request) {
        CustomRequest customRequest = new CustomRequest();
        customRequest.setCustomerName(request.customerName());
        customRequest.setEmail(request.email());
        customRequest.setPhone(request.phone());
        customRequest.setRequestType(request.requestType());
        customRequest.setAppointmentType(request.appointmentType());
        customRequest.setNotes(request.notes());
        customRequest.setPreferredDate(request.preferredDate());
        customRequest.setStatus(CustomRequestStatus.NEW);
        customRequest.setProduct(resolveProduct(request.productId()));
        customRequest.touch();
        return CustomRequestResponse.from(customRequestRepository.save(customRequest));
    }

    @Transactional
    public CustomRequestResponse updateStatus(Long id, CustomRequestStatusUpdateRequest request) {
        CustomRequest customRequest = customRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Custom request not found: " + id));
        customRequest.setStatus(request.status());
        customRequest.touch();
        return CustomRequestResponse.from(customRequestRepository.save(customRequest));
    }

    private Product resolveProduct(Long productId) {
        if (productId == null) {
            return null;
        }
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
    }
}
