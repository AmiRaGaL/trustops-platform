export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return <div className="state-block">{label}</div>;
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="state-block empty">{label}</div>;
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="state-block error" role="alert">
      {message}
    </div>
  );
}
