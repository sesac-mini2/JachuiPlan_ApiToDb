import oracleUtil from '../util/oracle.util.js';

class PerformanceMonitor {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.insertCounts = {};
        this.errorCounts = {};
        this.batchCounts = {};
    }

    start() {
        this.startTime = Date.now();
        console.log(`성능 모니터링 시작: ${new Date().toISOString()}`);
    }

    end() {
        this.endTime = Date.now();
        console.log(`성능 모니터링 종료: ${new Date().toISOString()}`);
        this.printSummary();
    }

    recordInsert(tableName, count) {
        if (!this.insertCounts[tableName]) {
            this.insertCounts[tableName] = 0;
        }
        this.insertCounts[tableName] += count;
    }

    recordError(tableName, count = 1) {
        if (!this.errorCounts[tableName]) {
            this.errorCounts[tableName] = 0;
        }
        this.errorCounts[tableName] += count;
    }

    recordBatch(tableName, count = 1) {
        if (!this.batchCounts[tableName]) {
            this.batchCounts[tableName] = 0;
        }
        this.batchCounts[tableName] += count;
    }

    printSummary() {
        if (!this.startTime || !this.endTime) {
            console.log("성능 모니터링이 완료되지 않았습니다.");
            return;
        }

        const duration = this.endTime - this.startTime;
        const durationSeconds = duration / 1000;
        const durationMinutes = durationSeconds / 60;

        console.log("\n=== 성능 모니터링 결과 ===");
        console.log(`총 실행 시간: ${durationMinutes.toFixed(2)}분 (${durationSeconds.toFixed(2)}초)`);

        // Connection Pool 상태
        const poolStatus = oracleUtil.getPoolStatus();
        if (poolStatus) {
            console.log("\n=== Connection Pool 상태 ===");
            console.log(`사용 중인 연결: ${poolStatus.connectionsInUse}/${poolStatus.connectionsOpen}`);
            console.log(`최대 연결 수: ${poolStatus.poolMax}`);
            console.log(`최소 연결 수: ${poolStatus.poolMin}`);
            console.log(`대기 중인 요청: ${poolStatus.queueLength}`);
        }

        // 삽입 통계
        console.log("\n=== 삽입 통계 ===");
        let totalInserts = 0;
        for (const [tableName, count] of Object.entries(this.insertCounts)) {
            console.log(`${tableName}: ${count.toLocaleString()}개 행`);
            totalInserts += count;
        }
        console.log(`총 삽입된 행: ${totalInserts.toLocaleString()}개`);

        if (totalInserts > 0) {
            const insertsPerSecond = totalInserts / durationSeconds;
            console.log(`평균 삽입 속도: ${insertsPerSecond.toFixed(2)} 행/초`);
        }

        // 배치 통계
        console.log("\n=== 배치 통계 ===");
        let totalBatches = 0;
        for (const [tableName, count] of Object.entries(this.batchCounts)) {
            console.log(`${tableName}: ${count}개 배치`);
            totalBatches += count;
        }
        console.log(`총 배치 수: ${totalBatches}개`);

        // 오류 통계
        if (Object.keys(this.errorCounts).length > 0) {
            console.log("\n=== 오류 통계 ===");
            for (const [tableName, count] of Object.entries(this.errorCounts)) {
                console.log(`${tableName}: ${count}개 오류`);
            }
        }

        console.log("=========================\n");
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }

    getElapsedTimeFormatted() {
        const elapsed = this.getElapsedTime();
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds % 60}초`;
        } else {
            return `${seconds}초`;
        }
    }
}

// 싱글톤 인스턴스
const monitor = new PerformanceMonitor();

export default monitor;
