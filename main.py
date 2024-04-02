import re
from datetime import datetime, timedelta

def adjust_srt_timing(input_file, output_file, speed_factor):
    # Define the regex pattern to match the timestamps
    time_pattern = re.compile(r'(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})')
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in lines:
            match = time_pattern.match(line)
            if match:
                # Convert timestamps to datetime objects
                start_time = datetime.strptime(match.group(1), '%H:%M:%S,%f')
                end_time = datetime.strptime(match.group(2), '%H:%M:%S,%f')
                
                # Adjust the timestamps based on the speed factor
                adjusted_start_time = start_time - timedelta(seconds=(start_time - datetime(1900, 1, 1)).total_seconds() * (1 - speed_factor))
                adjusted_end_time = end_time - timedelta(seconds=(end_time - datetime(1900, 1, 1)).total_seconds() * (1 - speed_factor))
                
                # Write the adjusted timestamps to the output file
                f.write(f"{adjusted_start_time.strftime('%H:%M:%S,%f')[:-3]} --> {adjusted_end_time.strftime('%H:%M:%S,%f')[:-3]}\n")
            else:
                # Write the unmodified line to the output file
                f.write(line)

# Example usage:
input_srt_path = '.local/bestdemo2.srt'
output_srt_path = '.local/bestdemo2_adjusted.srt'
speed_factor = 1.25  # Adjust this based on your video speed up or slow down factor

# Call the function with the inverse of the speed factor for speed up
adjust_srt_timing(input_srt_path, output_srt_path, 1/speed_factor)