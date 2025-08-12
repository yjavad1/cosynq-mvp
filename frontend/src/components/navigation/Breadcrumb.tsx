import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs based on current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    const routeMap: Record<string, string> = {
      'contacts': 'Contacts',
      'locations': 'Locations', 
      'spaces': 'Configure Spaces',
      'configure-spaces': 'Configure Spaces',
      'bookings': 'Bookings',
      'onboarding': 'Onboarding',
      'forgot-password': 'Forgot Password',
      'reset-password': 'Reset Password'
    };

    pathnames.forEach((path, index) => {
      const href = '/' + pathnames.slice(0, index + 1).join('/');
      
      // Handle location-based routes differently
      if (pathnames[index - 1] === 'locations' && (pathnames[index + 1] === 'spaces' || pathnames[index + 1] === 'bookings')) {
        // This is a locationId, skip it or show location name
        return;
      }
      
      let label = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
      
      // Special handling for location-based routes
      if (path === 'spaces' && pathnames[index - 2] === 'locations') {
        label = 'Configure Spaces';
      }
      if (path === 'bookings' && pathnames[index - 2] === 'locations') {
        label = 'Bookings';
      }
      
      const isCurrentPage = index === pathnames.length - 1;
      
      breadcrumbs.push({
        label,
        href: isCurrentPage ? undefined : href,
        isCurrentPage
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb for dashboard or single-level pages
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Home className="h-4 w-4" />
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-gray-700 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}