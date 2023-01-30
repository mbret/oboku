/**
 * This will prevent other password types fields in your form and after this component
 * to not have autocomplete or save the password prompt from browsers
 */
export const PreventAutocompleteFields = () => {
  return (
    <>
      {/* fake fields are a workaround for chrome autofill getting the wrong fields */}
      <input
        style={{
          display: "none"
        }}
        type="text"
        name="prevent_autofill"
      />
      <input
        style={{
          display: "none"
        }}
        type="password"
        name="password_fake"
      />
      <input
        style={{
          display: "none"
        }}
        type="password"
        name="password"
      />
    </>
  )
}
