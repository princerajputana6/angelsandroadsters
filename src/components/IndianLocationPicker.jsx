'use client';
import { useState, useEffect } from 'react';
import { INDIA_STATES, getCitiesForState } from '@/lib/india-locations';

/**
 * IndianLocationPicker
 * Renders a State dropdown and a City dropdown (filtered by selected state).
 *
 * Props:
 *   state        – controlled state value
 *   city         – controlled city value
 *   onStateChange(val) – called when state changes
 *   onCityChange(val)  – called when city changes
 *   required     – marks both fields required
 *   stateLabel   – override label for state (default "State *")
 *   cityLabel    – override label for city (default "City *")
 */
export default function IndianLocationPicker({
  state,
  city,
  onStateChange,
  onCityChange,
  required = false,
  stateLabel = 'State',
  cityLabel = 'City',
}) {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (state) {
      const list = getCitiesForState(state);
      setCities(list);
      // Clear city if it's no longer in the new state's list
      if (city && !list.includes(city)) {
        onCityChange('');
      }
    } else {
      setCities([]);
      onCityChange('');
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* State */}
      <div>
        <label className="block text-sm mb-1">
          {stateLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          required={required}
          className="input"
        >
          <option value="">— Select State —</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm mb-1">
          {cityLabel} {required && <span className="text-red-400">*</span>}
        </label>
        {cities.length > 0 ? (
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            required={required}
            className="input"
            disabled={!state}
          >
            <option value="">— Select City —</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__other__">Other (type below)</option>
          </select>
        ) : (
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            required={required}
            placeholder={state ? 'Enter your city' : 'Select a state first'}
            disabled={!state}
            className="input"
          />
        )}

        {/* If user picks "Other", show a text field */}
        {city === '__other__' && (
          <input
            type="text"
            placeholder="Type your city name"
            required={required}
            className="input mt-2"
            onChange={(e) => onCityChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
