package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank private String name;
    @NotBlank private String username;
    @NotBlank private String password;
    @NotBlank private String role; // OWNER or CASHIER
}
