import { LoginForm } from "@/app/login/LoginForm";
import { getLineConfig } from "@/lib/line/config";

export default function LoginPage() {
  const { loginEnabled: lineEnabled } = getLineConfig();
  return <LoginForm lineEnabled={lineEnabled} />;
}
