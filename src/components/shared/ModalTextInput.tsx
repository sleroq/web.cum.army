import React, { useRef } from 'react';
import { useState } from 'react';

interface Props<T extends string | number> {
  title: string;
  message: string;
  children?: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  onAccept?: (result: T) => void;
  onChange?: (result: T) => void;
  initialValue?: T;

  canCloseOnBackgroundClick?: boolean;
}

export default function ModalTextInput<T extends string | number>(props: Props<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(props.isOpen);
  const valueRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  const handleAccept = (e?: React.FormEvent) => {
    e?.preventDefault();
    props.onAccept?.(valueRef.current?.value as T);
  };

  if (!isOpen) {
    return <></>;
  }

  return (
    <div className="flex justify-center items-center h-screen absolute z-100 ">
      <div
        className="fixed inset-0 bg-transparent flex items-center justify-center"
        onClick={() => props.canCloseOnBackgroundClick && handleClose()}
      >
        <form
          className="p-6 rounded-lg shadow-lg w-1/2 bg-surface"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleAccept}
        >
          <h2 className="text-lg font-semibold">{props.title}</h2>
          <p className="mb-2">{props.message}</p>

          <input
            className="mb-6 appearance-none border w-full py-2 px-3 leading-tight focus:outline-hidden focus:shadow-outline bg-input border-border text-foreground rounded-sm shadow-md placeholder-muted"
            type="text"
            ref={valueRef!}
            defaultValue={props.initialValue}
            placeholder={props.message}
            autoFocus
          />

          {/*Buttons*/}
          <div className="flex flex-row justify-items-stretch gap-4 ">
            {props.onAccept !== undefined && (
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded"
              >
                Accept
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="bg-input hover:bg-surface text-foreground px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
