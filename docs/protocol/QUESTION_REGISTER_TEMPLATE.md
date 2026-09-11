# 質問台帳の作り方（QUESTION REGISTER）

**質問文だけ** を、**実回答と完全に分離して** 記録するための手順書。

## 1. なぜ質問文だけを分離するのか

- 個人面談では **話者分離を前提にしない**。面談者と生徒の区別が必要になった場合も、
  **まず質問ログで処理する**。そのためには質問文の一覧が先に必要になる。
- 事前アンケート・面談の **回答** は要配慮性が高く、Gitに置けない。
  一方 **質問文** は、回答と分離されている限り、手順書として記録・共有できる。
- 集計は `question_id` 単位で行うため、質問の同一性を先に固定しておく必要がある。

## 2. 絶対に守ること

> [!IMPORTANT]
> - 質問台帳に **実回答を書かない**。例示・サンプル・要約であっても書かない。
> - 事前アンケートCSVの **内容を表示・要約・分析しない**。
>   記録してよいのは、設問として提示された **質問文そのもの** だけ。
> - 氏名、呼ばれたい名前、個別のエピソード、悩みの具体的記述を書かない。
> - 実データ入りの質問台帳は `private/registers/` に置く。
>   `docs/` に置いてよいのは **列定義のみのテンプレート** と本手順書のみ。

## 3. 作成手順

1. `docs/protocol/question_register_template.csv` をコピーする。
2. コピー先を `private/registers/question_register.csv` とする（Git追跡対象外）。
3. 質問を1行ずつ登録する。`question_id` は一度振ったら変更しない。
4. 質問の出所（`source`）を必ず記録する。
   - `pre_survey`: 事前アンケートの設問
   - `interview_guide`: 面談の想定質問
   - `ad_hoc`: 面談中に生じた追加質問（文言を確認できた場合のみ）
5. 文言が面談ごとに揺れた場合は、`canonical_question_id` で代表質問に紐づけ、
   別の `question_id` として登録する。統合は集計時に行う。

## 4. `question_id` の付け方

- 形式: `Q-<連番3桁>`（例: `Q-001`, `Q-002`）
- 一度発行したIDは再利用・再割り当てしない。
- 削除ではなく `status` を `retired` にする。

## 5. 列定義

`question_register_template.csv` の列:

| 列名 | 説明 | 例 |
| --- | --- | --- |
| `question_id` | 質問の一意ID | `Q-001` |
| `source` | 出所（`pre_survey` / `interview_guide` / `ad_hoc`） | `pre_survey` |
| `question_text` | **質問文そのもの**（回答を含めない） | （設問文） |
| `question_type` | 形式（`open` / `single_choice` / `multi_choice` / `scale` / `free_text`） | `open` |
| `topic_tag` | 分析上のトピック区分（任意、非個人情報） | `motivation` |
| `sensitivity` | 要配慮度（`low` / `medium` / `high`） | `high` |
| `analysis_status` | 分析対象の可否（初期値は `pending`） | `pending` |
| `consent_dependency` | どの同意に依存するか（`interview_video` / `pre_survey` / `both`） | `pre_survey` |
| `canonical_question_id` | 表記揺れの代表質問ID（なければ空欄） | `Q-001` |
| `status` | `active` / `retired` | `active` |
| `notes` | 備考（**個人情報・回答内容を書かない**） | |

## 6. 事前アンケート由来の質問について

事前アンケートには、氏名、呼ばれたい名前、悩み、検索履歴・メモ・SNSに関わる内容、
感情が強く動いた出来事、面談で話したいことを尋ねる設問が含まれる。

- これらの **設問文** は `source=pre_survey`、`sensitivity=high` として登録してよい。
- ただし **`analysis_status` は `pending` のまま** とする。
- 事前アンケート回答を分析対象に含めるかは、
  **面談動画の同意とは別に確認するまで保留** であり、
  人間の責任者の確認後にのみ `analysis_status` を変更する。
- 氏名・呼ばれたい名前を尋ねる設問は、直接識別子を取得する設問であるため、
  `analysis_status` を `excluded` とし、分析対象に含めない。

## 7. 質問ログ（発話区間との対応）について

将来、文字起こしが承認された場合に限り、質問ログを作成する。

- 目的は **面談者の発話と生徒の発話を、質問文の一致で切り分けること**。
- 話者推定モデルは使わない。
- 質問ログにも **回答本文を書かない**。対応づけるのは `question_id` と区間の識別子まで。
- 時刻・タイムスタンプは内部処理にのみ用い、**共有・公開用成果物には含めない**。

## 8. 関連文書

- [ANALYSIS_SCOPE.md](ANALYSIS_SCOPE.md)
- [../governance/DATA_HANDLING_POLICY.md](../governance/DATA_HANDLING_POLICY.md)
- [../governance/RELEASE_GATE.md](../governance/RELEASE_GATE.md)
