import React from "react";
import Skeleton from "react-loading-skeleton";
import { Link } from "react-router-dom";
import { useGetPolicy } from "../../features/useGetPolicy";

const BargainingPage = () => {
    const { data: bargaining, isLoading, isError, error } = useGetPolicy("bargaining");

    if (isError) {
        return (
            <div className="policy-error">
                <h2>Content Unavailable</h2>
                <p>{error?.message || "We could not load this page at this time."}</p>
                <Link to="/" className="btn btn-primary mt-3">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="policy-container fade-in">
            {isLoading ? (
                <div className="policy-skeleton">
                    <Skeleton height={50} width="60%" className="mb-4" />
                    <Skeleton height={20} count={3} className="mb-3" />
                    <Skeleton height={150} className="mb-4" />
                    <Skeleton height={20} count={2} />
                </div>
            ) : (
                <div className="policy-card">
                    <div className="card-body">
                        {bargaining?.[0]?.content && (
                            <div
                                className="policy-section-block"
                                dangerouslySetInnerHTML={{ __html: bargaining[0].content }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BargainingPage;
