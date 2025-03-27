import React from "react";

export default function GradientExamples() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Gradient Card Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="gradient-card">
          <h2 className="text-xl font-semibold mb-2">Dark Gradient</h2>
          <p className="text-gray-300">
            This card uses the default dark gradient from your theme variables.
          </p>
          <div className="mt-4">
            <button className="btn-primary w-full">View Details</button>
          </div>
        </div>

        <div className="gradient-card-blue">
          <h2 className="text-xl font-semibold mb-2">Blue Gradient</h2>
          <p className="text-blue-100">
            This card uses the blue gradient from your theme variables.
          </p>
          <div className="mt-4">
            <button className="btn-primary w-full">View Details</button>
          </div>
        </div>

        <div className="gradient-card-green">
          <h2 className="text-xl font-semibold mb-2">Green Gradient</h2>
          <p className="text-green-100">
            This card uses the green gradient from your theme variables.
          </p>
          <div className="mt-4">
            <button className="btn-success w-full">View Details</button>
          </div>
        </div>

        <div className="gradient-card-red">
          <h2 className="text-xl font-semibold mb-2">Red Gradient</h2>
          <p className="text-red-100">
            This card uses the red gradient from your theme variables.
          </p>
          <div className="mt-4">
            <button className="btn-danger w-full">View Details</button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Usage Instructions</h2>
        <div className="component-card">
          <p className="mb-4">
            To use these gradient cards in your project, simply apply the
            appropriate class to your elements:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              <code className="bg-dark-100 px-2 py-1 rounded">
                .gradient-card
              </code>{" "}
              - Dark gradient
            </li>
            <li>
              <code className="bg-dark-100 px-2 py-1 rounded">
                .gradient-card-blue
              </code>{" "}
              - Blue gradient
            </li>
            <li>
              <code className="bg-dark-100 px-2 py-1 rounded">
                .gradient-card-green
              </code>{" "}
              - Green gradient
            </li>
            <li>
              <code className="bg-dark-100 px-2 py-1 rounded">
                .gradient-card-red
              </code>{" "}
              - Red gradient
            </li>
          </ul>
          <p>
            These gradient classes use CSS variables defined in your theme,
            making them consistent across your application.
          </p>
        </div>
      </div>
    </div>
  );
}
