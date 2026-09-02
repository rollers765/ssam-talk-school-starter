export function shouldUseRedirectLogin(viewportWidth: number, coarsePointer: boolean) {
  return viewportWidth <= 768 || coarsePointer;
}
