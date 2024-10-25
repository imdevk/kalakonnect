import React from 'react';

const ErrorMessage = ({ error }) => (
    <div className="text-center my-8 text-red-500">
        {error}
    </div>
);

export default ErrorMessage;