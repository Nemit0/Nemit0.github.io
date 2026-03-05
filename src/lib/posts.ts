function addPostCountsToTree(tree) {
    return tree.map(category => {
        // Initialize count with direct posts
        let count = category.posts.length;

        // If category has children, calculate their post counts recursively
        if (category.children && category.children.length > 0) {
            const childrenCounts = addPostCountsToTree(category.children);
            count += childrenCounts.reduce((sum, childCount) => sum + childCount.count, 0);

            // Assign computed counts back to children
            category.children = category.children.map((child, index) => ({ ...child, count: childrenCounts[index] }));
        }

        // Return the updated category with count included
        return { ...category, count };
    });
}