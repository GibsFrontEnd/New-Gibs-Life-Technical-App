import { Button } from "../components/UI/new-button";
//@ts-ignore
import landingImage from "../assets/landing_img.png";

const HomePage = () => {
  return (
    <div className="bg-white" id="home">
      <div className="overflow-clip pt-28 xl:pt-0">
        <div className="mx-auto grid grid-cols-12 items-center gap-2 md:gap-16 md:px-10 xl:w-[1280px] xl:px-2">
          <div className="col-span-12 px-4 md:col-span-7 md:px-0">
            <h1 className="mb-8 break-words text-5xl font-bold tracking-[-0.02em] lg:leading-20 lg:text-7xl bg-gradient-to-r from-blue-400 to-blue-800 bg-clip-text text-transparent animate-fadeInUp">
              MICROLIFE Enterprise-Ready Solutions for Modern Businesses
            </h1>
            <div className="mb-10 text-lg font-light text-gray-700 lg:text-3xl animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <p><strong>
               Specialized insurance systems for creating quotations and managing proposals with adaptable deployment solutions.
              </strong></p>
            </div>
            <div className="flex items-start gap-4 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
              <Button
                size="lg"
                asLink
                to="/login"
                data-discover="true"
                className="min-w-[300px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Login
              </Button>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <figure className="md:-mr-30 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
              <img
                alt=""
                className="w-full"
                sizes="100vw"
                loading="lazy"
                decoding="async"
                src={landingImage}
              />
            </figure>
          </div>
        </div>
      </div>

      {/* Add the same CSS animations as LoginPage */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 1.2s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;