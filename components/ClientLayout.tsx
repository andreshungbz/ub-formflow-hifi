"use client";

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import TeacherNav from "@/components/TeacherNav";
import DeanNav from "@/components/DeanNav";
import RegistrarNav from "@/components/RegistrarNav";
import AccountsNav from "@/components/AccountsNav";
import Footer from "@/components/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();

  // Don't render any nav while loading to prevent flashing
  if (loading) {
    return (
      <>
        <main className="grow">{children}</main>
        <Footer />
      </>
    );
  }

  // Render appropriate nav based on role
  let navComponent = null;
  if (role === "teacher") {
    navComponent = <TeacherNav />;
  } else if (role === "dean") {
    navComponent = <DeanNav />;
  } else if (role === "registrar") {
    navComponent = <RegistrarNav />;
  } else if (role === "accounts_receivable") {
    navComponent = <AccountsNav />;
  } else {
    navComponent = <Header />;
  }

  return (
    <>
      {navComponent}
      <main className="grow flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
