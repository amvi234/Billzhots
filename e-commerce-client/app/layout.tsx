import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import { ToastContainer } from "react-toastify";
import QueryProvider from "./providers/queryProvider";
import { AuthProvider } from "./providers";
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: "CartVault",
  description: "Developed by Amit Vikram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToastContainer position='top-right' autoClose={3000} />
        </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
