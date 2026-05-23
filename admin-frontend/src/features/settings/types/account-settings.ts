export interface AccountProfileFormValues {
  username: string
  display_name: string
}

export interface PasswordFormValues {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface AccountProfileResult {
  username: string
  display_name: string
}
