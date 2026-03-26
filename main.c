#include <stdio.h>
#include "microscope.h"

int main() {
    Microscope_t microscope;
    
    // 1. Initialize System
    Microscope_Init(&microscope);
    printf("--- Microscope System Initialized ---\n");
    printf("Initial Position: (%.2f, %.2f, %.2f)\n", 
            microscope.position.x, microscope.position.y, microscope.position.z);
    printf("Objective: %d\n\n", microscope.objective);

    // 2. Perform Movement
    printf("Moving stage to (12500, 8400, 500)...\n");
    Microscope_MoveTo(&microscope, 12500.0f, 8400.0f, 500.0f);
    printf("Current Position: (%.2f, %.2f, %.2f)\n\n", 
            microscope.position.x, microscope.position.y, microscope.position.z);

    // 3. Plan ROI
    printf("Planning ROI at 10%%, 20%% (size 5%%x5%%)...\n");
    if (Microscope_AddROI(&microscope, 10.0f, 20.0f, 5.0f, 5.0f)) {
        printf("ROI added successfully. Total ROIs: %d\n\n", microscope.roi_count);
    }

    // 4. Switch Objective
    printf("Switching to 40X Objective...\n");
    Microscope_SetObjective(&microscope, OBJ_40X);
    printf("New Objective: %d\n", microscope.objective);
    printf("Position after Parfocal Compensation: Z=%.2f\n\n", microscope.position.z);

    printf("--- Simulation Complete ---\n");
    return 0;
}
