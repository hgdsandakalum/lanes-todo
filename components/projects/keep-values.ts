import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic form reset, so an error
 * from the server leaves what was typed in place. Use as onSubmit instead of the action prop.
 */
export const keepValues = (dispatch: (form: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  startTransition(() => dispatch(form));
};
