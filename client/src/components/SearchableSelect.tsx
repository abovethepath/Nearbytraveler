import { useMemo } from "react";
import CreatableSelect from "react-select/creatable";

interface SearchableSelectProps {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Search...",
  className = "",
  allowCustom = true,
}: SearchableSelectProps) {
  const selectOptions = useMemo(
    () => options.map((o) => ({ value: o, label: o })),
    [options]
  );

  const selected = value ? { value, label: value } : null;

  return (
    <div className={className}>
      <CreatableSelect
        inputId={id}
        value={selected}
        options={selectOptions}
        onChange={(opt) => onChange(opt?.value || "")}
        onCreateOption={(input) => onChange(input)}
        placeholder={placeholder}
        isClearable
        isSearchable
        formatCreateLabel={(input) => `Use "${input}"`}
        isValidNewOption={allowCustom ? undefined : () => false}
        filterOption={(option, input) => {
          if (!input) return true;
          return option.label.toLowerCase().includes(input.toLowerCase());
        }}
        menuPlacement="auto"
        maxMenuHeight={280}
        styles={{
          control: (base, state) => ({
            ...base,
            marginTop: 4,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: state.isFocused ? "#f97316" : "#fed7aa",
            backgroundColor: "var(--rs-bg, #fff)",
            padding: "6px 4px",
            fontSize: 16,
            fontWeight: 500,
            boxShadow: state.isFocused ? "0 0 0 2px rgba(249,115,22,0.3)" : "0 1px 2px rgba(0,0,0,0.05)",
            "&:hover": { borderColor: "#fb923c" },
            minHeight: 50,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: 12,
            border: "2px solid #fed7aa",
            overflow: "hidden",
            zIndex: 9999,
            backgroundColor: "var(--rs-bg, #fff)",
          }),
          menuList: (base) => ({
            ...base,
            maxHeight: 280,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#fed7aa"
              : state.isFocused
              ? "#fff7ed"
              : "transparent",
            color: state.isSelected ? "#9a3412" : "inherit",
            fontWeight: state.isSelected ? 600 : 400,
            fontSize: 14,
            padding: "10px 16px",
            cursor: "pointer",
          }),
          singleValue: (base) => ({
            ...base,
            color: "inherit",
            fontWeight: 500,
          }),
          input: (base) => ({
            ...base,
            color: "inherit",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#9ca3af",
          }),
        }}
        classNames={{
          control: () => "dark:!bg-gray-800 dark:!border-orange-600",
          menu: () => "dark:!bg-gray-800 dark:!border-orange-600",
          option: () => "dark:!text-white dark:hover:!bg-gray-700 dark:!bg-gray-800",
          singleValue: () => "dark:!text-white",
          input: () => "dark:!text-white",
        }}
      />
    </div>
  );
}

export default SearchableSelect;
