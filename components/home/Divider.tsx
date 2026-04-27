export function Divider() {
  return (
    <div className="flex items-center gap-4 px-8 my-1">
      <div
        className="flex-1 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, #3d3d3f 20%, #3d3d3f 80%, transparent)',
        }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
        style={{ boxShadow: '0 0 8px rgba(94,177,49,0.55)' }}
      />
      <div
        className="flex-1 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, #3d3d3f 20%, #3d3d3f 80%, transparent)',
        }}
      />
    </div>
  )
}
