#include "microscope.h"
#include <string.h>
#include <math.h>

/* --- Internal Helpers --- */

static float clamp(float val, float min, float max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

/* --- Implementation --- */

void Microscope_Init(Microscope_t* m) {
    if (!m) return;
    memset(m, 0, sizeof(Microscope_t));
    
    m->objective = OBJ_10X;
    m->mode = MODE_BRIGHTFIELD;
    m->z_step = DEFAULT_Z_STEP;
    m->shutter_open = false;
    m->afs_enabled = false;
    m->roi_count = 0;
    m->is_initialized = true;
    
    // Initial position at home (0,0,0)
    m->position.x = 0;
    m->position.y = 0;
    m->position.z = 0;
}

void Microscope_MoveTo(Microscope_t* m, float x, float y, float z) {
    if (!m || !m->is_initialized) return;

    m->is_moving = true;

    // Apply software limits (clamping)
    m->position.x = clamp(x, 0, STAGE_X_LIMIT_MAX);
    m->position.y = clamp(y, 0, STAGE_Y_LIMIT_MAX);
    m->position.z = clamp(z, 0, STAGE_Z_LIMIT_MAX);

    /* 
     * HARDWARE INTEGRATION POINT:
     * Here you would call your motor driver functions:
     * Motor_X_Move(m->position.x);
     * Motor_Y_Move(m->position.y);
     * Motor_Z_Move(m->position.z);
     */

    m->is_moving = false;
}

bool Microscope_AddROI(Microscope_t* m, float x, float y, float w, float h) {
    if (!m || m->roi_count >= MAX_ROIS) return false;

    // Validate percentage bounds (0-100%)
    if (x < 0 || y < 0 || (x + w) > 100.0f || (y + h) > 100.0f) {
        return false;
    }

    ROI_t* new_roi = &m->rois[m->roi_count];
    new_roi->id = m->roi_count;
    new_roi->x_pct = x;
    new_roi->y_pct = y;
    new_roi->width_pct = w;
    new_roi->height_pct = h;
    new_roi->is_active = true;

    m->roi_count++;
    return true;
}

void Microscope_ClearROIs(Microscope_t* m) {
    if (!m) return;
    m->roi_count = 0;
    memset(m->rois, 0, sizeof(m->rois));
}

void Microscope_SetObjective(Microscope_t* m, Objective_t obj) {
    if (!m) return;

    // Parfocal compensation values (um)
    // These are offsets relative to the 10X objective
    static const float parfocal_offsets[] = {
        0.0f,    // 10X
        15.5f,   // 20X
        42.0f,   // 40X
        110.0f   // 100X
    };

    float current_offset = parfocal_offsets[m->objective];
    float next_offset = parfocal_offsets[obj];
    float diff = next_offset - current_offset;

    m->objective = obj;
    
    // Automatically adjust Z to maintain focus
    Microscope_MoveTo(m, m->position.x, m->position.y, m->position.z + diff);
}

void Microscope_SetShutter(Microscope_t* m, bool open) {
    if (!m) return;
    m->shutter_open = open;
    
    /*
     * HARDWARE INTEGRATION POINT:
     * GPIO_SetPin(SHUTTER_PIN, open ? HIGH : LOW);
     */
}
