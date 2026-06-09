"use client";

import {
  ChangeEvent,
  ComponentType,
  FC,
  FocusEvent,
  forwardRef,
  InputHTMLAttributes,
  memo,
  Ref,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import Select, {
  ClearIndicatorProps,
  components,
  ControlProps,
  DropdownIndicatorProps,
  GroupBase,
  MultiValueGenericProps,
  MultiValueRemoveProps,
  OptionProps,
  ValueContainerProps,
} from "react-select";
import { CustomDateTimePicker } from ".";
import { TipTap, SyntheticEvent, RichTextProps } from ".";
import { Icon } from "@iconify/react";
import { useAdminUtilsStore } from "@/src/store/utils.store";

export type SelectOption = {
  value: string | number | null;
  label: string;
};
export type IInputTypes =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multi-select"
  | "rich-text"
  | "date"
  | "datetime-local"
  | "tel"
  | "password"
  | "email";

type BaseProps = {
  type?: IInputTypes;
  name?: string;
  label?: string | null;
  error?: string;
  placeholder?: string;
  value?:
    | string
    | number
    | null
    | SelectOption
    | SelectOption[]
    | readonly string[]
    | undefined;
  onChange?: (event: { target: { name?: string; value: any } }) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  selectOptions?: SelectOption[];
  disabled?: boolean;
  richTextProps?: RichTextProps;
  telProps?: {
    inputProps?: {
      disabled?: boolean;
      name?: string;
      value?: string;
      placeholder?: string;
      onChange?: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => void;

      onBlur?: (
        event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => void;
    };
    selectProps?: {
      name?: string;
      placeholder?: string;
      disabled?: boolean;
      value?: string;
      onBlur?: (
        event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => void;

      onChange?: (event: {
        target: {
          name?: string;
          value: string;
        };
      }) => void;
    };
  };
};

type MergedHTMLAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "onBlur"
> &
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange" | "onBlur"
  >;

export interface InputFieldProps extends BaseProps, MergedHTMLAttributes {}

const CustomOption: FC<OptionProps<unknown, boolean, GroupBase<any>>> = (
  props,
) => {
  const { isSelected, label, data, options } = props;

  const isLastOption =
    (options[options.length - 1] as { value: string })?.value ===
    (data as { value: string })?.value;

  return (
    <components.Option {...props}>
      <li
        className={`flex cursor-pointer items-center justify-between rounded-[0.375rem] p-[0.625rem_0.5rem] text-[#101828] ${
          isSelected && "bg-[#F9FAFB]"
        } transition-all duration-[.4s] hover:bg-[#F9FAFB] ${
          isLastOption ? "" : "mb-[0.25rem]"
        } text-[1rem] font-[400] leading-[1.5rem]`}
      >
        {label}
        {isSelected && (
          <Icon icon={"hugeicons:checkmark-circle-01"} color="#007FFF" />
        )}
      </li>
    </components.Option>
  );
};

const CustomControl: FC<ControlProps<unknown, boolean, GroupBase<unknown>>> = ({
  children,
  ...props
}) => (
  <components.Control {...props}>
    <div
      style={{
        padding: "0px 0.1875rem 0px 0.875rem",
        alignItems: "center",
        margin: 0,
        width: "100%",
        height: "100%",
        fontSize: "1rem",
        display: "flex",
      }}
    >
      {children}
    </div>
  </components.Control>
);

const CustomMultiValueContainer: FC<
  MultiValueGenericProps<unknown, boolean, GroupBase<any>>
> = (props) => <components.MultiValueContainer {...props} />;

const CustomMultiValueLabel: FC<
  MultiValueGenericProps<unknown, boolean, GroupBase<any>>
> = (props) => {
  return <components.MultiValueLabel {...props} />;
};

const CustomMultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <Icon icon={"hugeicons:cancel-circle"} color="#98A2B3" />
    </components.MultiValueRemove>
  );
};

const CustomValueContainer: FC<
  ValueContainerProps<unknown, boolean, GroupBase<any>>
> = ({ children, ...props }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showEllipsis, setShowEllipsis] = useState(false);
  const count = (props.getValue() as SelectOption[]).length;

  useEffect(() => {
    if (!props.isMulti) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const overflowing = el.scrollWidth > el.clientWidth;
      setShowEllipsis(overflowing);
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, props.isMulti]);

  if (!props.isMulti)
    return (
      <components.ValueContainer {...props}>{children}</components.ValueContainer>
    );

  return (
    <components.ValueContainer {...props}>
      {showEllipsis && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#98A2B3",
            flexShrink: 0,
            userSelect: "none",
            paddingRight: "4px",
          }}
        >
          …
        </span>
      )}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          overflowX: "auto",
          overflowY: "hidden",
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
    </components.ValueContainer>
  );
};

const InputField = memo(
  forwardRef<any, InputFieldProps>(
    (
      {
        type = "text",
        name = "input",
        label = "Email",
        error,
        placeholder = "johnex@iexcelo.com",
        value,
        onChange,
        selectOptions,
        disabled,
        telProps,
        richTextProps,
        onBlur,
        ...rest
      },
      ref,
    ) => {
      const [showPassword, setVisibility] = useState(false);
      const controlRef = useRef<HTMLDivElement>(null);
      const { uploadImage, isUploadingImage } = useAdminUtilsStore();
      const [hydrated, setHydrated] = useState(false);

      const {
        inputProps: {
          disabled: telInputDisabled,
          name: telInputName,
          value: telInputValue,
          placeholder: telInputPlaceholder,
          onChange: telInputChange,
          onBlur: telInputBlur,
          ...otherTelInputProps
        } = {},
        selectProps: {
          name: telSelName,
          onChange: telSelChange,
          value: telSelValue,
          disabled: telSelDisabled,
          onBlur: telSelBlur,
          placeholder: telSelPlaceholder,
          ...otherTelSelProps
        } = {},
      } = telProps || {};

      const CustomDropdownIndicator = (props: DropdownIndicatorProps) => {
        return (
          <components.DropdownIndicator {...props}>
            {error && type !== "tel" ? (
              <Icon icon={"hugeicons:information-circle"} color="#F04438" />
            ) : (
              <Icon
                icon={"hugeicons:arrow-up-01"}
                color={props.isFocused ? "#007FFF" : "#D0D5DD"}
                height={"1.25rem"}
                width={"1.25rem"}
                style={{
                  transition: "all .4s",
                  transform: !props.selectProps.menuIsOpen
                    ? "rotate(180deg)"
                    : undefined,
                }}
              />
            )}
          </components.DropdownIndicator>
        );
      };

      useEffect(() => {
        if (typeof window !== "undefined") setHydrated(true);
      }, []);
      if (hydrated)
        return (
          <div className="flex w-full flex-col gap-[0.375rem] transition-all duration-[.4s]">
            {label && (
              <label
                htmlFor={name}
                className="text-[0.875rem] font-[500] leading-[1.25rem] text-[#344054]"
              >
                {label}
              </label>
            )}
            <div className="relative group h-fit w-full">
              {type === "textarea" ? (
                <textarea
                  disabled={!!disabled}
                  id={name}
                  name={name}
                  placeholder={placeholder}
                  value={value as string}
                  onChange={onChange && onChange}
                  onBlur={onBlur && onBlur}
                  ref={ref as Ref<HTMLTextAreaElement>}
                  className={`border outline-none ${
                    !!error
                      ? "border-[#FDA29B] text-[#F04438]"
                      : "border-[#D0D5DD] text-[#667085]"
                  } h-[6.25rem] w-full rounded-[0.5rem] bg-white p-[0.625rem_0.875rem] text-[1rem] font-[400] leading-[1.5rem] placeholder:font-[300] placeholder:opacity-[.7]`}
                  {...rest}
                />
              ) : type === "select" || type === "multi-select" ? (
                <Select
                  instanceId={"admin-select"}
                  isDisabled={!!disabled}
                  isMulti={type === "multi-select"}
                  options={selectOptions && selectOptions}
                  value={
                    type === "multi-select"
                      ? (value as string)
                          ?.split(",")
                          ?.map((val) => val.trim())
                          ?.map((val) =>
                            selectOptions?.find(
                              (option) => option.value === val,
                            ),
                          )
                          .filter(Boolean)
                      : selectOptions?.find((option) => option.value === value)
                  }
                  menuPlacement="auto"
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  onChange={(selectedOptions) => {
                    const syntheticEvent = {
                      target: {
                        name: name || "select",
                        value: Array.isArray(selectedOptions)
                          ? selectedOptions
                              .map((option) => option.value)
                              .join(", ")
                          : (selectedOptions as SelectOption)?.value,
                        selectedOptions,
                      },
                    };

                    onChange?.(
                      syntheticEvent as ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      > & {
                        target: {
                          name?: string | undefined;
                          value: any;
                          selectedOptions?: SelectOption[] | undefined;
                        };
                      },
                    );
                  }}
                  onBlur={onBlur && onBlur}
                  placeholder={placeholder}
                  ref={ref}
                  components={{
                    Option: CustomOption,
                    Control: CustomControl,
                    DropdownIndicator: CustomDropdownIndicator,
                    ValueContainer: CustomValueContainer,
                    MultiValueContainer: CustomMultiValueContainer,
                    MultiValueLabel: CustomMultiValueLabel,
                    MultiValueRemove: CustomMultiValueRemove,
                    ClearIndicator: null as unknown as ComponentType<
                      ClearIndicatorProps<any, boolean, GroupBase<any>>
                    >,
                  }}
                  closeMenuOnSelect={!(type === "multi-select")}
                  hideSelectedOptions={false}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: 0,
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "#fff",
                      minHeight: 0,
                      height: "fit-content",
                      marginTop: "0.25rem",
                      overflow: "auto",
                      padding: "0.25rem 0.375rem",
                      borderRadius: "0.5rem",
                      border: !!error
                        ? "1px solid #FDA29B"
                        : "1px solid #EAECF0",
                      boxShadow:
                        "0px 0.75rem 1rem -0.25rem rgba(16, 24, 40, 0.08), 0px 0.25rem 0.375rem -2px rgba(16, 24, 40, 0.03)",
                    }),
                    multiValueRemove: () => ({}),
                    indicatorSeparator: () => ({
                      display: "none",
                    }),
                    option: () => ({
                      padding: "0",
                      margin: "0",
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      margin: 0,
                      padding: 0,
                      opacity: 0.7,
                      fontWeight: 300,
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      fontWeight: 400,
                      color: "#667085",
                    }),
                    multiValue: () => ({
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#fff",
                      gap: "0.1875rem",
                      width: "max-content",
                      boxSizing: "border-box",
                      border: "1px solid #D0D5DD",
                      padding: "0.25rem",
                      borderRadius: "0.375rem",
                      margin: 0,
                      marginRight: "0.375rem",
                    }),
                    multiValueLabel: () => ({
                      fontSize: "0.875rem",
                      color: "#344054",
                      fontWeight: 400,
                      lineHeight: "1.25rem",
                      whiteSpace: "nowrap",
                    }),
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      outline: "none",
                      borderColor: !!error
                        ? "#FDA29B"
                        : state.isFocused
                          ? "#007FFF"
                          : "#D0D5DD",
                      minHeight: 0,
                      height: "2.75rem",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: 400,
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                      "& .css-19bb58m": {
                        padding: 0,
                        margin: 0,
                      },
                      "& .css-9jq23d": {
                        padding: 0,
                        paddingRight: "0.625rem",
                        margin: 0,
                      },
                      "& .css-hlgwow": {
                        padding: 0,
                        margin: 0,
                      },
                      "& .css-1mjpsdc": {
                        padding: 0,
                        margin: 0,
                      },
                      "&:hover": {
                        borderColor: "#007FFF",
                      },
                    }),
                  }}
                  {...rest}
                />
              ) : type === "rich-text" ? (
                <TipTap
                  name={name}
                  value={value as string}
                  onChange={
                    onChange &&
                    (onChange as unknown as (event: SyntheticEvent) => void)
                  }
                  onBlur={
                    onBlur as unknown as (
                      event: FocusEvent<HTMLDivElement, Element>,
                    ) => void
                  }
                  error={error}
                  ref={ref}
                  richTextProps={richTextProps}
                  onImageUpload={
                    richTextProps?.image?.allowed
                      ? (file) => uploadImage(file, richTextProps.image!.folder)
                      : undefined
                  }
                  {...rest}
                />
              ) : type === "date" || type === "datetime-local" ? (
                <CustomDateTimePicker
                  name={name}
                  disabled={!!disabled}
                  placeholder={placeholder}
                  onBlur={onBlur}
                  onChange={onChange}
                  error={error}
                  value={value}
                  ref={ref}
                  {...rest}
                />
              ) : type === "tel" ? (
                <div
                  ref={controlRef}
                  className={`border outline-none transition-all duration-[.4s] ${
                    !!error
                      ? "border-[#FDA29B] text-[#F04438]"
                      : "border-[#D0D5DD] text-[#667085] focus-within:border-[#007FFF]"
                  } flex h-[2.75rem] w-full overflow-hidden rounded-[0.5rem] bg-white`}
                >
                  <Select
                    instanceId={"admin-tel-select"}
                    isDisabled={telSelDisabled || disabled}
                    isMulti={false}
                    options={selectOptions && selectOptions}
                    value={
                      !!telSelValue
                        ? selectOptions?.find(
                            (option) => option?.value === telSelValue,
                          )
                        : undefined
                    }
                    menuPlacement="auto"
                    className="w-[20%]"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    onChange={(selectedOptions) => {
                      const syntheticEvent = {
                        target: {
                          name: telSelName || "select",
                          value: (selectedOptions as SelectOption)?.value,
                        },
                      };

                      telSelChange?.(
                        syntheticEvent as ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        > & {
                          target: {
                            name?: string | undefined;
                            value: string;
                            selectedOptions?: SelectOption[] | undefined;
                          };
                        },
                      );
                    }}
                    onBlur={telSelBlur && telSelBlur}
                    placeholder={telSelPlaceholder}
                    components={{
                      Option: CustomOption,
                      Control: CustomControl,
                      DropdownIndicator: CustomDropdownIndicator,
                      MultiValueContainer: CustomMultiValueContainer,
                      MultiValueLabel: CustomMultiValueLabel,
                      MultiValueRemove: CustomMultiValueRemove,
                      ClearIndicator: null as unknown as ComponentType<
                        ClearIndicatorProps<any, boolean, GroupBase<any>>
                      >,
                    }}
                    closeMenuOnSelect={true}
                    hideSelectedOptions={false}
                    styles={{
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                        width: controlRef?.current?.clientWidth,
                        left: controlRef?.current?.getBoundingClientRect().left,
                        position: "fixed",
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        padding: 0,
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: "#fff",
                        minHeight: 0,
                        height: "fit-content",
                        marginTop: "0.25rem",
                        overflow: "auto",
                        padding: "0.25rem 0.375rem",
                        borderRadius: "0.5rem",
                        border: !!error
                          ? "1px solid #FDA29B"
                          : "1px solid #EAECF0",
                        boxShadow:
                          "0px 0.75rem 1rem -0.25rem rgba(16, 24, 40, 0.08), 0px 0.25rem 0.375rem -2px rgba(16, 24, 40, 0.03)",
                      }),
                      multiValueRemove: () => ({}),
                      indicatorSeparator: () => ({
                        display: "none",
                      }),
                      option: () => ({
                        padding: "0",
                        margin: "0",
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        margin: 0,
                        padding: 0,
                        opacity: 0.7,
                        fontWeight: 300,
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        fontWeight: 400,
                        color: "#667085",
                      }),
                      multiValue: () => ({
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        gap: "0.1875rem",
                        width: "max-content",
                        boxSizing: "border-box",
                        border: "1px solid #D0D5DD",
                        padding: "0.25rem",
                        borderRadius: "0.375rem",
                        margin: 0,
                        marginRight: "0.375rem",
                      }),
                      multiValueLabel: () => ({
                        fontSize: "0.875rem",
                        color: "#344054",
                        fontWeight: 400,
                        lineHeight: "1.25rem",
                      }),
                      control: (baseStyles) => ({
                        ...baseStyles,
                        outline: "none",
                        borderColor: "transparent",
                        minHeight: 0,
                        height: "100%",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: 400,
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                        boxShadow: "none",
                        "& .css-19bb58m": {
                          padding: 0,
                          margin: 0,
                        },
                        "& .css-9jq23d": {
                          padding: 0,
                          paddingRight: "0.625rem",
                          margin: 0,
                        },
                        "& .css-hlgwow": {
                          padding: 0,
                          margin: 0,
                        },
                        "& .css-1mjpsdc": {
                          padding: 0,
                          margin: 0,
                        },
                        "&:hover": {
                          borderColor: "transparent",
                        },
                      }),
                    }}
                    {...otherTelSelProps}
                  />
                  <input
                    id={telInputName}
                    disabled={telInputDisabled || !!disabled}
                    name={telInputName}
                    type="text"
                    placeholder={telInputPlaceholder}
                    onBlur={telInputBlur}
                    onChange={telInputChange && telInputChange}
                    value={telInputValue}
                    className={`h-full w-[80%] rounded-r-[0.5rem] bg-white p-[0.625rem_0.875rem_0.625rem_0] text-[1rem] font-[400] leading-[1.5rem] placeholder:font-[300] placeholder:opacity-[.7]`}
                    {...otherTelInputProps}
                  />
                </div>
              ) : (
                <input
                  id={name}
                  disabled={!!disabled}
                  name={name}
                  type={type === "password" && showPassword ? "text" : type}
                  placeholder={placeholder}
                  value={value as string}
                  onChange={onChange && onChange}
                  onBlur={onBlur && onBlur}
                  ref={ref}
                  className={`border outline-none ${
                    !!error
                      ? "border-[#FDA29B] text-[#F04438]"
                      : "border-[#D0D5DD] text-[#667085]"
                  } h-[2.75rem] w-full rounded-[0.5rem] bg-white p-[0.625rem_0.875rem] text-[1rem] font-[400] leading-[1.5rem] placeholder:font-[300] placeholder:opacity-[.7]`}
                  {...rest}
                />
              )}
              {type === "rich-text" && isUploadingImage && (
                <Icon
                  icon="svg-spinners:ring-resize"
                  className="absolute bottom-0 right-[0.875rem] translate-y-[-85%] text-[#007FFF] w-4 h-4"
                />
              )}
              {!!error &&
                type !== "email" &&
                type !== "password" &&
                type !== "date" &&
                type !== "datetime-local" &&
                type !== "multi-select" &&
                type !== "select" && (
                  <Icon
                    className="absolute bottom-0 right-[0.875rem] translate-y-[-85%]"
                    icon={"hugeicons:information-circle"}
                    color="#F04438"
                  />
                )}

              {type === "email" &&
                (!!error ? (
                  <Icon
                    className="absolute bottom-0 right-[0.875rem] translate-y-[-85%]"
                    icon={"hugeicons:information-circle"}
                    color="#F04438"
                  />
                ) : (
                  <Icon
                    className="absolute group-focus-within:text-[#007FFF] transition-all duration-[.4s] text-[#667085] bottom-0 right-[0.875rem] translate-y-[-85%]"
                    icon={"hugeicons:mail-01"}
                  />
                ))}
              {type === "password" && (
                <button
                  onClick={() =>
                    setVisibility((formerVisibility) => !formerVisibility)
                  }
                  type="button"
                  className="cursor-pointer"
                >
                  <Icon
                    height="1rem"
                    width="1rem"
                    className={`absolute bottom-0 right-[0.875rem] transition-all duration-[.4s] translate-y-[-85%] ${
                      !!error
                        ? "text-[#F04438]"
                        : "group-focus-within:text-[#007FFF] text-[#667085]"
                    }`}
                    icon={
                      !showPassword ? "hugeicons:view-off" : "hugeicons:view"
                    }
                  />
                </button>
              )}
            </div>
            {!!error && (
              <p className="text-[0.875rem] font-[400] leading-[1.25rem] text-[#F04438]">
                {error}
              </p>
            )}
          </div>
        );
    },
  ),
);

InputField.displayName = "InputField";

export { InputField };
