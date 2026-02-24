import { useState, useRef, useEffect } from 'react';
import { cn } from '../ui/Button';

export const OtpInput = ({ length = 4, onComplete, isLoading }) => {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // allow only one character
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // submit if all fields are filled
        const combinedOtp = newOtp.join('');
        if (combinedOtp.length === length) {
            onComplete(combinedOtp);
        }

        // Move to next input if current field is filled
        if (value && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="flex justify-center gap-3 w-full">
            {otp.map((data, index) => {
                return (
                    <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        name="otp"
                        maxLength={1}
                        ref={(ref) => inputRefs.current[index] = ref}
                        value={data}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        disabled={isLoading}
                        className={cn(
                            "w-14 h-16 text-center text-display-md font-syne font-bold bg-gigpay-card border-[1.5px] border-gigpay-border rounded-[12px] focus:border-gigpay-navy focus:shadow-[2px_2px_0px_#C8F135] outline-none transition-all disabled:opacity-50",
                            data ? "border-gigpay-navy shadow-brutal-sm" : ""
                        )}
                    />
                );
            })}
        </div>
    );
};
