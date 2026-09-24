import type { Metadata } from "next";
import "./styles/globals.css";
import { ToastContainer } from "react-toastify";
import QueryProvider from "./providers/queryProvider";
import { AuthProvider } from "./providers";
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: "Billzhots",
  description: "Developed by Amit Vikram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
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
