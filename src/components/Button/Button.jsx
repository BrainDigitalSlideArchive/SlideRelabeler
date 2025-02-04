// A React component that renders a button element
import React from 'react';

import './Button.css';

const Button = ({ onClick, children }) => (
    <button className="button" onClick={onClick}>
        {children}
    </button>
    );