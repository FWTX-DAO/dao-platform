import { Video, ArrowUpRight, Phone } from "lucide-react";

export function WeeklyRoundtable() {
  return (
    <section
      aria-labelledby="roundtable-title"
      className="rounded-lg border border-violet-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-50 p-3 text-violet-600">
            <Video className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="roundtable-title"
              className="text-lg font-semibold text-gray-900"
            >
              Weekly Roundtable
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Wednesdays, 12–1 pm Central · Fort Worth DAO
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Join the conversation from wherever you are.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <details className="text-sm text-gray-600">
            <summary className="min-h-11 cursor-pointer content-center rounded-sm focus-visible:outline-2 focus-visible:outline-violet-600">
              Join by phone
            </summary>
            <div className="space-y-1 py-2">
              <a
                className="inline-flex items-center gap-2 text-violet-600 underline"
                href="tel:+16363242768"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> +1 636-324-2768
              </a>
              <p>PIN: 516 761 226#</p>
              <a
                className="block text-violet-600 underline"
                href="https://tel.meet/ezt-uxsc-kwm?pin=7319286365734"
                target="_blank"
                rel="noopener noreferrer"
              >
                More phone numbers
              </a>
            </div>
          </details>
          <a
            href="https://meet.google.com/ezt-uxsc-kwm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            Join Google Meet{" "}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
