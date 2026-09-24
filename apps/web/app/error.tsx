"use client"

export default function Error() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-white">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold text-white select-none">
          500 Internal Server Error
        </h1>
        <p className="text-eventcontent/65 text-sm">
          An unexpected error occurred. If this keeps happening, please contact
          support.
        </p>
      </div>
    </div>
  )
}
