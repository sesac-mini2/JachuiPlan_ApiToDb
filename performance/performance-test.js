import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 성능 테스트 클래스
class PerformanceTest {
    constructor(commits) {
        this.results = [];
        this.commits = commits; // 비교할 커밋들
        this.testConfig = {
            startYearMonth: "202407",
            endYearMonth: "202412",
            // 서울특별시 절반 테스트 (12개 구)
            testRegionCodes: [
                "11110",
                "11140",
                "11170",
                "11200",
                "11215",
                "11230",
                "11260",
                "11290",
                "11305",
                "11320",
                "11350",
                "11380"
            ],
            // 성능 테스트 반복 횟수
            repeatCount: 5
        };
    }

    // Git 상태 확인
    getCurrentGitStatus() {
        try {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
            const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

            return {
                branch,
                commit: commit.substring(0, 7), // 짧은 커밋 해시
                hasChanges: status.length > 0,
                status
            };
        } catch (error) {
            console.error('Git 상태 확인 실패:', error.message);
            return null;
        }
    }

    // Git 상태 백업
    backupCurrentState() {
        try {
            const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

            // 현재 변경사항이 있다면 스태시에 저장
            const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
            let stashCreated = false;

            if (status.length > 0) {
                execSync('git stash push -m "performance-test-backup"');
                stashCreated = true;
                console.log('📦 현재 변경사항을 스태시에 저장했습니다.');
            }

            return {
                branch: currentBranch,
                commit: currentCommit,
                stashCreated
            };
        } catch (error) {
            console.error('Git 상태 백업 실패:', error.message);
            throw error;
        }
    }

    // Git 상태 복원
    restoreState(backup) {
        try {
            // 브랜치 복원
            execSync(`git checkout ${backup.branch}`, { stdio: 'inherit' });

            // 스태시된 변경사항 복원
            if (backup.stashCreated) {
                execSync('git stash pop', { stdio: 'inherit' });
                console.log('📦 스태시된 변경사항을 복원했습니다.');
            }

            console.log(`✅ Git 상태가 복원되었습니다: ${backup.branch} (${backup.commit.substring(0, 7)})`);
        } catch (error) {
            console.error('Git 상태 복원 실패:', error.message);
            throw error;
        }
    }

    // 특정 커밋으로 리셋
    resetToSpecificCommit(commitHash) {
        try {
            // 하드 리셋
            execSync(`git reset --hard ${commitHash}`, { stdio: 'inherit' });

            console.log(`⏮️ 특정 커밋으로 리셋되었습니다: ${commitHash.substring(0, 7)}`);
            return commitHash;
        } catch (error) {
            console.error('특정 커밋으로 리셋 실패:', error.message);
            throw error;
        }
    }

    // 최신 상태로 풀
    pullLatestChanges() {
        try {
            execSync('git pull origin error-handle', { stdio: 'inherit' });
            console.log('⬇️ 최신 변경사항을 가져왔습니다.');

            const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
            return currentCommit;
        } catch (error) {
            console.error('Git pull 실패:', error.message);
            throw error;
        }
    }

    // 메인 테스트 실행 (index.js를 별도 프로세스로 실행)
    async runMainTest(testName, gitInfo) {
        console.log(`\n🚀 테스트 시작: ${testName}`);
        console.log(`📍 Git 상태: ${gitInfo.branch} (${gitInfo.commit})`);
        console.log(`🔄 ${this.testConfig.repeatCount}번 반복 측정을 시작합니다...`);

        const measurements = [];

        for (let i = 1; i <= this.testConfig.repeatCount; i++) {
            console.log(`   측정 ${i}/${this.testConfig.repeatCount}...`);

            const startTime = performance.now();

            try {
                // index.js를 별도 프로세스로 실행
                const startYearMonth = this.testConfig.startYearMonth;
                const endYearMonth = this.testConfig.endYearMonth;

                const output = execSync(`node index.js ${startYearMonth} ${endYearMonth}`, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 300000, // 5분 타임아웃
                    cwd: path.join(__dirname, '..') // 상위 디렉토리에서 실행
                });

                const totalTime = performance.now() - startTime;
                measurements.push({
                    iteration: i,
                    time: totalTime,
                    success: true,
                    output: output.trim()
                });

                console.log(`     → ${(totalTime / 1000).toFixed(2)}초`);

            } catch (error) {
                const totalTime = performance.now() - startTime;
                measurements.push({
                    iteration: i,
                    time: totalTime,
                    success: false,
                    error: error.message,
                    stderr: error.stderr ? error.stderr.toString() : null
                });

                console.log(`     → 실패 (${(totalTime / 1000).toFixed(2)}초): ${error.message}`);
            }
        }

        // 통계 계산
        const successfulMeasurements = measurements.filter(m => m.success);
        const failedCount = measurements.length - successfulMeasurements.length;

        if (successfulMeasurements.length === 0) {
            console.log(`❌ ${testName} 완전 실패 - 모든 측정이 실패했습니다.`);
            return {
                testName,
                gitInfo,
                success: false,
                error: "모든 측정이 실패했습니다.",
                measurements,
                statistics: null,
                timestamp: new Date().toISOString()
            };
        }

        const times = successfulMeasurements.map(m => m.time);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const stdDev = Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length);

        const statistics = {
            successCount: successfulMeasurements.length,
            failCount: failedCount,
            avgTime,
            minTime,
            maxTime,
            stdDev,
            coefficient: (stdDev / avgTime) * 100 // 변동계수(%)
        };

        console.log(`✅ ${testName} 완료`);
        console.log(`   평균: ${(avgTime / 1000).toFixed(2)}초`);
        console.log(`   최소: ${(minTime / 1000).toFixed(2)}초`);
        console.log(`   최대: ${(maxTime / 1000).toFixed(2)}초`);
        console.log(`   표준편차: ${(stdDev / 1000).toFixed(2)}초`);
        console.log(`   성공률: ${successfulMeasurements.length}/${measurements.length} (${((successfulMeasurements.length / measurements.length) * 100).toFixed(1)}%)`);

        return {
            testName,
            gitInfo,
            success: true,
            measurements,
            statistics,
            timestamp: new Date().toISOString()
        };
    }

    // 결과 저장
    saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-test-results-${timestamp}.json`;
        const filepath = path.join(__dirname, filename); // 현재 performance 디렉토리에 저장

        const report = {
            testConfig: this.testConfig,
            commits: this.commits,
            results: this.results,
            summary: this.generateSummary()
        };

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`📄 결과가 저장되었습니다: ${filename}`);

        return filepath;
    }

    // 결과 요약 생성
    generateSummary() {
        if (this.results.length < 2) return null;

        const [beforeResult, afterResult] = this.results;

        if (!beforeResult.success || !afterResult.success) {
            return {
                note: "일부 테스트가 실패하여 비교할 수 없습니다.",
                beforeSuccess: beforeResult.success,
                afterSuccess: afterResult.success
            };
        }

        const beforeAvg = beforeResult.statistics.avgTime;
        const afterAvg = afterResult.statistics.avgTime;
        const timeDiff = afterAvg - beforeAvg;
        const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100;

        return {
            totalTimeComparison: {
                before: `${(beforeAvg / 1000).toFixed(2)}초`,
                after: `${(afterAvg / 1000).toFixed(2)}초`,
                difference: `${(timeDiff / 1000).toFixed(2)}초`,
                improvement: `${improvement.toFixed(2)}%`
            },
            beforeStats: {
                avg: `${(beforeResult.statistics.avgTime / 1000).toFixed(2)}초`,
                min: `${(beforeResult.statistics.minTime / 1000).toFixed(2)}초`,
                max: `${(beforeResult.statistics.maxTime / 1000).toFixed(2)}초`,
                stdDev: `${(beforeResult.statistics.stdDev / 1000).toFixed(2)}초`,
                coefficient: `${beforeResult.statistics.coefficient.toFixed(1)}%`,
                successRate: `${beforeResult.statistics.successCount}/${beforeResult.statistics.successCount + beforeResult.statistics.failCount}`
            },
            afterStats: {
                avg: `${(afterResult.statistics.avgTime / 1000).toFixed(2)}초`,
                min: `${(afterResult.statistics.minTime / 1000).toFixed(2)}초`,
                max: `${(afterResult.statistics.maxTime / 1000).toFixed(2)}초`,
                stdDev: `${(afterResult.statistics.stdDev / 1000).toFixed(2)}초`,
                coefficient: `${afterResult.statistics.coefficient.toFixed(1)}%`,
                successRate: `${afterResult.statistics.successCount}/${afterResult.statistics.successCount + afterResult.statistics.failCount}`
            }
        };
    }

    // 결과 출력
    printResults() {
        console.log('\n📊 성능 테스트 결과');
        console.log('='.repeat(50));

        this.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.testName}`);
            console.log(`   Git: ${result.gitInfo.branch} (${result.gitInfo.commit})`);
            console.log(`   성공: ${result.success ? '✅' : '❌'}`);

            if (result.success && result.statistics) {
                console.log(`   평균 소요시간: ${(result.statistics.avgTime / 1000).toFixed(2)}초`);
                console.log(`   최소 소요시간: ${(result.statistics.minTime / 1000).toFixed(2)}초`);
                console.log(`   최대 소요시간: ${(result.statistics.maxTime / 1000).toFixed(2)}초`);
                console.log(`   표준편차: ${(result.statistics.stdDev / 1000).toFixed(2)}초`);
                console.log(`   변동계수: ${result.statistics.coefficient.toFixed(1)}%`);
                console.log(`   성공률: ${result.statistics.successCount}/${result.statistics.successCount + result.statistics.failCount} (${((result.statistics.successCount / (result.statistics.successCount + result.statistics.failCount)) * 100).toFixed(1)}%)`);
            } else if (!result.success) {
                console.log(`   오류: ${result.error}`);
            }
        });

        // 비교 결과
        const summary = this.generateSummary();
        if (summary) {
            console.log('\n🔄 성능 비교');
            console.log('='.repeat(50));

            if (summary.note) {
                console.log(summary.note);
                console.log(`이전 버전 성공: ${summary.beforeSuccess ? '✅' : '❌'}`);
                console.log(`최신 버전 성공: ${summary.afterSuccess ? '✅' : '❌'}`);
            } else if (summary.totalTimeComparison) {
                console.log(`평균 소요시간 변화: ${summary.totalTimeComparison.before} → ${summary.totalTimeComparison.after}`);
                console.log(`차이: ${summary.totalTimeComparison.difference} (${summary.totalTimeComparison.improvement})`);

                console.log(`\n📈 상세 통계:`);
                console.log(`이전 버전 - 평균: ${summary.beforeStats.avg}, 최소: ${summary.beforeStats.min}, 최대: ${summary.beforeStats.max}`);
                console.log(`         표준편차: ${summary.beforeStats.stdDev}, 변동계수: ${summary.beforeStats.coefficient}, 성공률: ${summary.beforeStats.successRate}`);
                console.log(`최신 버전 - 평균: ${summary.afterStats.avg}, 최소: ${summary.afterStats.min}, 최대: ${summary.afterStats.max}`);
                console.log(`         표준편차: ${summary.afterStats.stdDev}, 변동계수: ${summary.afterStats.coefficient}, 성공률: ${summary.afterStats.successRate}`);

                if (parseFloat(summary.totalTimeComparison.improvement) > 0) {
                    console.log('\n🎉 성능이 개선되었습니다!');
                } else {
                    console.log('\n⚠️ 성능이 저하되었습니다.');
                }
            }
        }
    }

    // 메인 테스트 실행
    async runFullTest() {
        console.log('🏁 성능 테스트 시작');
        console.log('='.repeat(50));

        let backup = null;

        try {
            // 1. 현재 상태 백업
            backup = this.backupCurrentState();

            if (this.commits.length === 1) {
                // 1개 커밋: 입력받은 커밋과 최신 상태 비교
                const [targetCommit] = this.commits;

                // 2-1. 특정 커밋으로 리셋하여 테스트
                this.resetToSpecificCommit(targetCommit);
                const beforeGitInfo = this.getCurrentGitStatus();
                const beforeResult = await this.runMainTest(`이전 버전 테스트 (${targetCommit.substring(0, 7)})`, beforeGitInfo);
                this.results.push(beforeResult);

                // 2-2. 최신 상태로 풀하여 테스트
                this.pullLatestChanges();
                const afterGitInfo = this.getCurrentGitStatus();
                const afterResult = await this.runMainTest('최신 버전 테스트', afterGitInfo);
                this.results.push(afterResult);

            } else if (this.commits.length === 2) {
                // 2개 커밋: 두 커밋간의 비교
                const [firstCommit, secondCommit] = this.commits;

                // 2-1. 첫 번째 커밋으로 리셋하여 테스트
                this.resetToSpecificCommit(firstCommit);
                const firstGitInfo = this.getCurrentGitStatus();
                const firstResult = await this.runMainTest(`첫 번째 커밋 테스트 (${firstCommit.substring(0, 7)})`, firstGitInfo);
                this.results.push(firstResult);

                // 2-2. 두 번째 커밋으로 리셋하여 테스트
                this.resetToSpecificCommit(secondCommit);
                const secondGitInfo = this.getCurrentGitStatus();
                const secondResult = await this.runMainTest(`두 번째 커밋 테스트 (${secondCommit.substring(0, 7)})`, secondGitInfo);
                this.results.push(secondResult);
            }

            // 3. 결과 출력 및 저장
            this.printResults();
            this.saveResults();

        } catch (error) {
            console.error('❌ 테스트 중 오류 발생:', error.message);
        } finally {
            // 4. 원래 상태로 복원
            if (backup) {
                try {
                    this.restoreState(backup);
                } catch (restoreError) {
                    console.error('⚠️ 상태 복원 실패:', restoreError.message);
                }
            }
        }
    }
}

// 매개변수 처리 및 검증
function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('❌ 사용법: node performance/performance-test.js <commit1> [commit2]');
        console.error('   1개 커밋: 입력받은 커밋과 최신 상태 비교');
        console.error('   2개 커밋: 두 커밋간의 성능 비교');
        console.error('   예시: node performance/performance-test.js 610a6de');
        console.error('   예시: node performance/performance-test.js 610a6de b89f7c2');
        process.exit(1);
    }

    if (args.length > 2) {
        console.error('❌ 최대 2개의 커밋만 입력할 수 있습니다.');
        process.exit(1);
    }

    return args;
}

// 커밋 유효성 검증
function validateCommits(commits) {
    for (const commit of commits) {
        try {
            execSync(`git rev-parse --verify ${commit}`, { stdio: 'pipe' });
        } catch (error) {
            console.error(`❌ 유효하지 않은 커밋: ${commit}`);
            process.exit(1);
        }
    }
}

// 실행
const commits = parseArguments();
validateCommits(commits);

console.log(`📋 테스트 계획:`);
if (commits.length === 1) {
    console.log(`   커밋 ${commits[0].substring(0, 7)} vs 최신 상태`);
} else {
    console.log(`   커밋 ${commits[0].substring(0, 7)} vs 커밋 ${commits[1].substring(0, 7)}`);
}

const test = new PerformanceTest(commits);
test.runFullTest().catch(console.error);
