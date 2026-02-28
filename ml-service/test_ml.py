import pandas as pd
import io
import sys
from routers.predict import _engineer_features

csv_content = """worker_id,date,worked,rainfall_mm,temp_celsius,average_rating,incentives_earned,net_earnings,efficiency_ratio
1,2025-12-28,1,0,33.3,4.06,4858,63289,0.74
1,2025-12-29,1,8.3,21.6,4.28,4570,48905,0.51
1,2025-12-30,1,8.3,30.8,4.46,24481,130181,0.67"""

try:
    df = pd.read_csv(io.StringIO(csv_content))
    df = _engineer_features(df)
    print("SUCCESS")
    print(df.head())
except Exception as e:
    import traceback
    traceback.print_exc()
