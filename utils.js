class PriorityQueue {
    constructor(comparator = (a, b) => a > b) {
        this._heap = [];
        this._comparator = comparator;
    }

    size() {
        return this._heap.length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    peek() {
        return this._heap[0];
    }

    push(...values) {
        values.forEach(value => {
            this._heap.push(value);
            this._siftUp();
        });
        return this.size();
    }

    pop() {
        const poppedValue = this.peek();
        const bottom = this.size() - 1;
        if (bottom > 0) {
            this._swap(0, bottom);
        }
        this._heap.pop();
        this._siftDown();
        return poppedValue;
    }

    _parent(i) {
        return Math.floor((i - 1) / 2);
    }

    _leftChild(i) {
        return i * 2 + 1;
    }

    _rightChild(i) {
        return i * 2 + 2;
    }

    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }

    _compare(i, j) {
        return this._comparator(this._heap[i], this._heap[j]);
    }

    _siftUp() {
        let node = this.size() - 1;
        while (node > 0 && this._compare(node, this._parent(node))) {
            this._swap(node, this._parent(node));
            node = this._parent(node);
        }
    }

    _siftDown() {
        let node = 0;
        while (
            (this._leftChild(node) < this.size() && this._compare(this._leftChild(node), node)) ||
            (this._rightChild(node) < this.size() && this._compare(this._rightChild(node), node))
        ) {
            let maxChild = (this._rightChild(node) < this.size() && this._compare(this._rightChild(node), this._leftChild(node))) ? this._rightChild(node) : this._leftChild(node);
            this._swap(node, maxChild);
            node = maxChild;
        }
    }
}
