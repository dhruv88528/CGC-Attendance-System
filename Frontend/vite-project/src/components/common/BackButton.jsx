import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Back Button Component
 * Displays a back arrow button that navigates to the previous page
 */
const BackButton = ({
    label = 'Back',
    to = null, // Optional: specific route to go to
    className = '',
    showLabel = true
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1); // Go to previous page
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`
        inline-flex items-center gap-2 
        px-3 py-2 
        text-gray-600 hover:text-gray-900
        bg-white hover:bg-gray-100
        border border-gray-200 hover:border-gray-300
        rounded-lg
        transition-all duration-200
        shadow-sm hover:shadow
        ${className}
      `}
        >
            <ArrowLeft size={18} />
            {showLabel && <span className="font-medium">{label}</span>}
        </button>
    );
};

export default BackButton;