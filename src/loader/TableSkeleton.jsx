import React from 'react';
import './TableSkeleton.css'

const TableSkeleton = () => {
    return (
        <div className="table-skeleton-loader">
            <table>
                <thead>
                    <tr>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                        <th className="skeleton th"></th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, index) => (
                        <tr key={index}>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                            <td className="skeleton td"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default TableSkeleton