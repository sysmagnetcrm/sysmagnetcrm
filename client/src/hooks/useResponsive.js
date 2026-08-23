import { useEffect, useState } from 'react';

const getWindowSize = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const useResponsive = () => {
  const [{ width, height }, setSize] = useState(getWindowSize());

  useEffect(() => {
    const handleResize = () => {
      setSize(getWindowSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
};

export default useResponsive;
