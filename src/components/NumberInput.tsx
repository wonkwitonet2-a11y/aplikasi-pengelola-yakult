import React, { useState, useEffect } from "react";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onChange: (val: number) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

function NumberInputInner({
  value,
  onChange,
  allowDecimal = false,
  min,
  max,
  className = "",
  disabled = false,
  onFocus,
  ...rest
}: NumberInputProps) {
  const [displayVal, setDisplayVal] = useState<string>(
    value !== undefined && value !== null ? String(Math.trunc(value)) : "0"
  );

  // Sync displayVal when value prop changes externally
  useEffect(() => {
    const valTrunc = value !== undefined && value !== null ? Math.trunc(value) : 0;
    const parsedCurrent = parseInt(displayVal, 10) || 0;
    if (parsedCurrent !== valTrunc || (valTrunc === 0 && displayVal !== "0" && displayVal !== "")) {
      setDisplayVal(String(valTrunc));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (!allowDecimal) {
      // Strip any dot/comma and everything after it
      raw = raw.split(/[.,]/)[0];
    }

    // Sanitize non-numeric characters (allow numbers, minus, dot, comma if allowed)
    raw = allowDecimal ? raw.replace(/[^0-9.,-]/g, "") : raw.replace(/[^0-9-]/g, "");

    if (!raw || raw.trim() === "") {
      setDisplayVal("");
      let num = 0;
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      onChange(num);
      return;
    }

    // Remove leading zeroes before digits (e.g. "05" -> "5", "00" -> "0")
    let sanitized = raw.replace(/^-?0+(?=\d)/, raw.startsWith("-") ? "-" : "");
    if (sanitized === "" || sanitized === "-") sanitized = "";

    let num = parseInt(sanitized, 10);
    if (isNaN(num)) num = 0;

    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    setDisplayVal(sanitized);
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onDragStart={(e) => e.preventDefault()}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
}

export const NumberInput = React.memo(NumberInputInner);
