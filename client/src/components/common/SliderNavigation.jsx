import React from 'react';

const SliderNavigation = ({ activeTab, setActiveTab, tabs }) => {

    return (
        <div className="bg-primary-darker rounded-full shadow-lg inline-block">
            <div className="flex items-center">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-4 sm:px-6 py-3 text-sm font-medium ${activeTab === tab.id
                            ? 'bg-primary-medium text-primary-off-white'
                            : 'text-primary-light hover:bg-primary-dark hover:text-primary-off-white'
                            } rounded-full transition-colors duration-200 flex items-center`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon && <tab.icon className="mr-2" />}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SliderNavigation;