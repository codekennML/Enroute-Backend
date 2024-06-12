export const distanceBetweenCoordinates(coordinates0: [number, number], coordinates1: [number, number]): number => {
    function deg2rad(degrees: number): number {
        // Store the value of pi.
        const pi = Math.PI;
        // Multiply degrees by pi divided by 180 to convert to radians.
        return degrees * (pi / 180);
    }

    const earthRadius = 6371; // Earth's radius in kilometers
    const lat1 = deg2rad(coordinates0[0]);
    const lon1 = deg2rad(coordinates0[1]);
    const lat2 = deg2rad(coordinates1[0]);
    const lon2 = deg2rad(coordinates1[1]);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    // Check if coord1 is before coord2
    const isBefore = (lat1 < lat2) || ((lat1 === lat2) && (lon1 < lon2));

    // Return negative distance if coord1 is before coord2
    return isBefore ? -distance : distance;
}

