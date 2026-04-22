import Auth from "./Auth";

export default function AdminAuth(props) {
  return <Auth {...props} allowedPortals={["admin"]} initialPortal="admin" hideBackToHome={false} />;
}
