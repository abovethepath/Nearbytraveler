// Navigate to a safe fallback — never use history.back()
export function goBack() {
  window.location.href = '/home';
}