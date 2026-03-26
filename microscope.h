#ifndef MICROSCOPE_H
#define MICROSCOPE_H

#include <stdint.h>
#include <stdbool.h>

/* --- Hardware Limits (um) --- */
#define STAGE_X_LIMIT_MAX  75000.0f
#define STAGE_Y_LIMIT_MAX  25000.0f
#define STAGE_Z_LIMIT_MAX  20000.0f

/* --- System Constants --- */
#define MAX_ROIS 16
#define DEFAULT_Z_STEP 1.0f

/* --- Enumerations --- */
typedef enum {
    OBJ_10X = 0,
    OBJ_20X,
    OBJ_40X,
    OBJ_100X
} Objective_t;

typedef enum {
    MODE_BRIGHTFIELD = 0,
    MODE_FLUORESCENCE
} ImagingMode_t;

typedef enum {
    CH_DAPI = 0,
    CH_FITC,
    CH_CY3,
    CH_CY5,
    CH_CFP
} FluChannel_t;

/* --- Data Structures --- */

typedef struct {
    uint8_t id;
    float x_pct;      // 0.0 - 100.0
    float y_pct;      // 0.0 - 100.0
    float width_pct;  // 0.0 - 100.0
    float height_pct; // 0.0 - 100.0
    bool is_active;
} ROI_t;

typedef struct {
    struct {
        float x; // um
        float y; // um
        float z; // um
    } position;

    Objective_t objective;
    ImagingMode_t mode;
    FluChannel_t channel;
    
    bool shutter_open;
    float z_step;
    bool afs_enabled;

    ROI_t rois[MAX_ROIS];
    uint8_t roi_count;

    bool is_moving;
    bool is_initialized;
} Microscope_t;

/* --- API Functions --- */

/**
 * @brief Initialize the microscope system state.
 */
void Microscope_Init(Microscope_t* m);

/**
 * @brief Move the stage to an absolute position with limit checking.
 */
void Microscope_MoveTo(Microscope_t* m, float x, float y, float z);

/**
 * @brief Add a new ROI using percentage coordinates.
 */
bool Microscope_AddROI(Microscope_t* m, float x, float y, float w, float h);

/**
 * @brief Clear all planned ROIs.
 */
void Microscope_ClearROIs(Microscope_t* m);

/**
 * @brief Set the current objective and apply parfocal compensation.
 */
void Microscope_SetObjective(Microscope_t* m, Objective_t obj);

/**
 * @brief Toggle the light shutter.
 */
void Microscope_SetShutter(Microscope_t* m, bool open);

#endif /* MICROSCOPE_H */
