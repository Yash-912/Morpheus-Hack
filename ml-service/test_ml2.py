import pandas as pd
import io
import sys
from routers.predict import _engineer_features, SCALER_COLS, MODEL_FEATURE_ORDER
from main import earnings_model

async def main():
    if not earnings_model.is_loaded:
        await earnings_model.load_model()
        print("Model loaded manually.")
    
    csv_content = """worker_id,date,worked,rainfall_mm,temp_celsius,average_rating,incentives_earned,net_earnings,efficiency_ratio
1,2025-12-28,1,0,33.3,4.06,4858,63289,0.74
1,2025-12-29,1,8.3,21.6,4.28,4570,48905,0.51
1,2025-12-30,1,8.3,30.8,4.46,24481,130181,0.67"""

    df = pd.read_csv(io.StringIO(csv_content))
    df = _engineer_features(df)
    last_rows = df.groupby("worker_id").tail(1).copy()
    
    try:
        print("Scaler cols:", SCALER_COLS)
        print("Trying to scale...")
        last_rows[SCALER_COLS] = earnings_model._scaler.transform(last_rows[SCALER_COLS].values)
        print("Scaling success.")
        predictions = earnings_model._model.predict(last_rows[MODEL_FEATURE_ORDER].values)
        print("Prediction:", predictions)
    except Exception as e:
        import traceback
        traceback.print_exc()

import asyncio
asyncio.run(main())
