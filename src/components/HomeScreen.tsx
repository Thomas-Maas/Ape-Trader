type Props = {
  onPlay: () => void;
  label?: string;
};

export default function HomeScreen({ onPlay, label = "Play" }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onPlay}
        aria-label={label}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl transition hover:scale-105 hover:bg-gray-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="ml-1 h-10 w-10 fill-black"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <span className="text-sm font-semibold uppercase tracking-widest text-white drop-shadow">
        {label}
      </span>
    </div>
  );
}
