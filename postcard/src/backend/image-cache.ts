export default abstract class ImageCache {
    private static readonly maxCacheSize = 10;
    private static readonly cache: Array<{ id: string, file: File }> = [];
    
    static query(id: string) {
        return this.cache.find((file) => file.id === id)?.file;
    }

    static insert(id: string, file: File) {
        this.cache.push({ id, file });
        if (this.cache.length > this.maxCacheSize) {
            this.cache.shift();
        }
    }

    static delete(id: string) {
        const index = this.cache.findIndex((file) => file.id === id);
        if (index !== -1) {
            this.cache.splice(index, 1);
        }
    }
}