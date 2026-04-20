package com.stockpro.product.validation;

/**
 * ValidationGroups — markers for Jakarta Validation to distinguish operations.
 ****
 *  The Validation Group is what tells Spring: 
 * ---------> "Hey, only require the SKU when we
 * are in the 'OnCreate' context; let it slide when we are in 'OnUpdate'
 * context."
 * 
 */

public interface ValidationGroups {
    interface OnCreate {
    }

    interface OnUpdate {
    }
}
