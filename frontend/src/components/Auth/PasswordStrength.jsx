import zxcvbn from "zxcvbn";

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { score, feedback } = zxcvbn(password);

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-400",
    "bg-blue-500",
    "bg-green-500"
  ];

  const labels = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong"
  ];

  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded">
        <div
          className={`h-2 rounded ${colors[score]}`}
          style={{ width: `${(score + 1) * 20}%` }}
        />
      </div>
      <p className="text-sm mt-1 text-gray-600">
        {labels[score]}
        {feedback.warning && ` – ${feedback.warning}`}
      </p>
    </div>
  );
}
