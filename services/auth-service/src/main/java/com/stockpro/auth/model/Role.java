package com.stockpro.auth.model;

/**
 * Role — defines all possible access levels for StockPro platform users.
 *
 * <ul>
 *   <li>STAFF   — basic read-only inventory access</li>
 *   <li>MANAGER — can manage stock and view reports for their department</li>
 *   <li>OFFICER — cross-department operations and approvals</li>
 *   <li>ADMIN   — full system access including user management</li>
 * </ul>
 *
 * Stored as a VARCHAR in the database via {@code @Enumerated(EnumType.STRING)}.
 * Any value outside this enum will be rejected at deserialization time,
 * making it impossible to persist an invalid role.
 */
public enum Role {
    STAFF,
    MANAGER,
    OFFICER,
    ADMIN
}
