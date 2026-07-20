import Footer from "@/components/shared/footer";
import Navbar from "@/components/shared/navbar";

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </>
  );
}