"use client"

import * as React from "react"
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useFormState,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseControllerProps,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form"

type FormContextValue = {
  id: string
  descriptionId: string
  titleId: string
}

const FormContext = React.createContext<FormContextValue | null>(null)

function useHeadlessForm() {
  const context = React.use(FormContext)

  if (!context) {
    throw new Error("Form components must be used inside <Form>.")
  }

  return context
}

type FormProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.ComponentProps<"form">,
  "onInvalid" | "onSubmit"
> & {
  formOptions?: UseFormProps<TFieldValues>
  onInvalid?: SubmitErrorHandler<TFieldValues>
  onSubmit: SubmitHandler<TFieldValues>
}

function FormRoot<TFieldValues extends FieldValues = FieldValues>({
  children,
  formOptions,
  onInvalid,
  onSubmit,
  ...props
}: FormProps<TFieldValues>) {
  const form = useForm<TFieldValues>(formOptions)
  const id = React.useId()
  const context = {
    id,
    descriptionId: `${id}-description`,
    titleId: `${id}-title`,
  }

  return (
    <FormContext value={context}>
      <FormProvider {...form}>
        <form
          {...props}
          aria-describedby={context.descriptionId}
          aria-labelledby={context.titleId}
          noValidate
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          {children}
        </form>
      </FormProvider>
    </FormContext>
  )
}

function FormTitle(props: React.ComponentProps<"h2">) {
  const { titleId } = useHeadlessForm()

  return <h2 id={titleId} {...props} />
}

function FormDescription(props: React.ComponentProps<"p">) {
  const { descriptionId } = useHeadlessForm()

  return <p id={descriptionId} {...props} />
}

function getFieldId(formId: string, name: string) {
  return `${formId}-field-${name}`
}

function getFieldErrorId(formId: string, name: string) {
  return `${getFieldId(formId, name)}-error`
}

type FormLabelProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = React.ComponentProps<"label"> & {
  name: TName
}

function FormLabel<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ htmlFor, name, ...props }: FormLabelProps<TFieldValues, TName>) {
  const { id } = useHeadlessForm()

  return <label htmlFor={htmlFor ?? getFieldId(id, name)} {...props} />
}

type FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ReturnType<typeof useController<TFieldValues, TName>>

type FormFieldOverride<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = (
  props: FormFieldRenderProps<TFieldValues, TName>
) => Record<string, unknown>

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, "control"> & {
  children:
    | React.ReactElement
    | ((props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode)
  override?: FormFieldOverride<TFieldValues, TName>
  required?: boolean | string
}

type NativeControlProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
  checked?: boolean
  disabled?: boolean
  id?: string
  name?: string
  onBlur?: (event: React.FocusEvent) => void
  onChange?: (event: React.ChangeEvent) => void
  ref?: React.Ref<unknown>
  required?: boolean
  type?: string
  value?: unknown
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref) {
        ref.current = value
      }
    }
  }
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  children,
  override,
  required,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  const { id } = useHeadlessForm()
  const rules =
    required === undefined || props.rules?.required !== undefined
      ? props.rules
      : {
          ...props.rules,
          required:
            typeof required === "string"
              ? required
              : required && "This field is required",
        }
  const requiredRule = rules?.required
  const isRequired =
    typeof requiredRule === "object"
      ? requiredRule.value
      : Boolean(requiredRule)
  const controller = useController<TFieldValues, TName>({
    ...props,
    rules,
  })

  if (typeof children === "function") {
    return children(controller)
  }

  const child = children as React.ReactElement<NativeControlProps>
  const childProps = child.props
  const { field, fieldState } = controller
  const checkbox = childProps.type === "checkbox"
  const radio = childProps.type === "radio"
  const errorId = getFieldErrorId(id, props.name)
  const describedBy = [
    childProps["aria-describedby"],
    fieldState.invalid ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ")

  if (override) {
    return React.cloneElement(child, {
      "aria-describedby": describedBy,
      "aria-invalid": fieldState.invalid,
      disabled: field.disabled,
      id: childProps.id ?? getFieldId(id, props.name),
      name: field.name,
      ref: mergeRefs(childProps.ref, field.ref),
      ...(isRequired ? { "aria-required": true, required: true } : undefined),
      ...override(controller),
    } as NativeControlProps)
  }

  const controlProps: NativeControlProps = {
    "aria-describedby": describedBy,
    "aria-invalid": fieldState.invalid,
    disabled: field.disabled,
    id: childProps.id ?? getFieldId(id, props.name),
    name: field.name,
    onBlur: (event) => {
      childProps.onBlur?.(event)
      field.onBlur()
    },
    onChange: (event) => {
      childProps.onChange?.(event)
      field.onChange(event)
    },
    ref: mergeRefs(childProps.ref, field.ref),
  }

  if (isRequired) {
    controlProps["aria-required"] = true
    controlProps.required = true
  }

  if (checkbox) {
    controlProps.checked = Boolean(field.value)
  } else if (radio) {
    controlProps.checked = field.value === childProps.value
  } else {
    controlProps.value = field.value ?? ""
  }

  return React.cloneElement(child, controlProps)
}

type FormErrorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<React.ComponentProps<"p">, "children"> & {
  children?: React.ReactNode | ((error: FieldError) => React.ReactNode)
  name: TName
}

function FormError<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  children,
  id: providedId,
  name,
  ...props
}: FormErrorProps<TFieldValues, TName>) {
  const { id } = useHeadlessForm()
  const form = useFormContext<TFieldValues>()
  const formState = useFormState<TFieldValues>({
    control: form.control,
    name,
  })
  const error = form.getFieldState(name, formState).error

  if (!error) {
    return null
  }

  const content =
    typeof children === "function"
      ? children(error)
      : (children ?? error.message)

  if (content == null) {
    return null
  }

  return (
    <p id={providedId ?? getFieldErrorId(id, name)} {...props}>
      {content}
    </p>
  )
}

type FormSubmitRenderProps = {
  form: UseFormReturn<FieldValues>
  isLoading: boolean
  isSubmitting: boolean
}

type FormSubmitProps = {
  children:
    | React.ReactElement
    | React.ReactNode
    | ((props: FormSubmitRenderProps) => React.ReactNode)
  disableWhileSubmitting?: boolean
  loading?: boolean
}

type SubmitControlProps = {
  "aria-busy"?: boolean
  disabled?: boolean
  type?: string
}

function FormSubmit({
  children,
  disableWhileSubmitting = true,
  loading = false,
}: FormSubmitProps) {
  const form = useFormContext()
  const isSubmitting = form.formState.isSubmitting
  const isLoading = loading || isSubmitting
  const disabled = loading || (disableWhileSubmitting && isSubmitting)

  if (typeof children === "function") {
    return children({ form, isLoading, isSubmitting })
  }

  if (!React.isValidElement<SubmitControlProps>(children)) {
    return (
      <button
        aria-busy={isLoading || undefined}
        disabled={disabled}
        type="submit"
      >
        {children}
      </button>
    )
  }

  return React.cloneElement(children, {
    "aria-busy": children.props["aria-busy"] || isLoading || undefined,
    disabled: children.props.disabled || disabled,
    type: "submit",
  })
}

type FormResetRenderProps = {
  form: UseFormReturn<FieldValues>
  isDirty: boolean
  isSubmitting: boolean
}

type FormResetProps = {
  children:
    | React.ReactElement
    | React.ReactNode
    | ((props: FormResetRenderProps) => React.ReactNode)
}

type ResetControlProps = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  type?: string
}

function FormReset({ children }: FormResetProps) {
  const form = useFormContext()
  const { isDirty, isSubmitting } = form.formState

  if (typeof children === "function") {
    return children({ form, isDirty, isSubmitting })
  }

  if (!React.isValidElement<ResetControlProps>(children)) {
    return (
      <button type="button" onClick={() => form.reset()}>
        {children}
      </button>
    )
  }

  return React.cloneElement(children, {
    onClick: (event) => {
      children.props.onClick?.(event)

      if (!event.defaultPrevented) {
        form.reset()
      }
    },
    type: "button",
  })
}

const Form = Object.assign(FormRoot, {
  Description: FormDescription,
  Error: FormError,
  Field: FormField,
  Label: FormLabel,
  Reset: FormReset,
  Submit: FormSubmit,
  Title: FormTitle,
})

export { Form }
export type {
  FormErrorProps,
  FormFieldOverride,
  FormFieldProps,
  FormFieldRenderProps,
  FormLabelProps,
  FormProps,
  FormResetProps,
  FormSubmitProps,
}
